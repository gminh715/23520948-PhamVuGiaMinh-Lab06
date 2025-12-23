import { Pool } from 'pg';

// Create a connection pool for Render PostgreSQL
let pool: Pool | null = null;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false, // Required for Render
            },
            max: 20, // Maximum pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 60000, // 60 seconds timeout
        });
    }
    return pool;
}

export interface DocumentChunk {
    id: number;
    title: string;
    content: string;
    slug: string;
    section: string;
    embedding: number[];
    created_at: Date;
}

export interface DocumentMetadata {
    title: string;
    slug: string;
    section: string;
}

// Helper function to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry database connection with exponential backoff
async function retryDatabaseQuery<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 5000
): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            const isTimeout = error?.message?.includes('timeout') ||
                error?.message?.includes('fetch failed') ||
                error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';

            if (!isTimeout || attempt === maxRetries) {
                throw error;
            }

            const delay = baseDelay * Math.pow(1.5, attempt);
            console.log(`Database timeout. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await sleep(delay);
        }
    }
    throw new Error('Max retries exceeded');
}

// Search for similar documents using vector similarity
export async function searchSimilarDocuments(
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.7
): Promise<DocumentChunk[]> {
    return retryDatabaseQuery(async () => {
        const pool = getPool();
        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        const result = await pool.query(
            `SELECT 
              id,
              title,
              content,
              slug,
              section,
              1 - (embedding <=> $1::vector) as similarity
            FROM document_chunks
            WHERE 1 - (embedding <=> $1::vector) > $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3`,
            [embeddingStr, threshold, limit]
        );

        return result.rows as DocumentChunk[];
    });
}

// Fallback text search when embeddings aren't available
export async function searchDocumentsByText(
    query: string,
    limit: number = 5
): Promise<DocumentChunk[]> {
    return retryDatabaseQuery(async () => {
        const pool = getPool();

        // Extract keywords from query (including short words for better matching)
        const keywords = query.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 1); // Allow 2+ char words

        console.log(`🔎 Searching with keywords: ${keywords.join(', ')}`);

        // If no keywords, return some documents
        if (keywords.length === 0) {
            const result = await pool.query(
                `SELECT id, title, content, slug, section 
                FROM document_chunks 
                ORDER BY id 
                LIMIT $1`,
                [limit]
            );
            return result.rows as DocumentChunk[];
        }

        // Try to find documents containing ANY keyword (more flexible)
        const conditions = keywords.map((_, i) =>
            `(LOWER(content) LIKE $${i + 1} OR LOWER(title) LIKE $${i + 1})`
        ).join(' OR ');

        const params = keywords.map(k => `%${k}%`);
        params.push(limit.toString());

        const result = await pool.query(
            `SELECT id, title, content, slug, section,
                (${keywords.map((_, i) =>
                `CASE WHEN LOWER(content) LIKE $${i + 1} THEN 1 ELSE 0 END`
            ).join(' + ')}) as relevance
            FROM document_chunks
            WHERE ${conditions}
            ORDER BY relevance DESC, id
            LIMIT $${params.length}`,
            params
        );

        console.log(`🔎 Found ${result.rows.length} matching documents`);

        // If still no results, return first few documents as context
        if (result.rows.length === 0) {
            console.log('🔎 No keyword matches, returning general context');
            const fallbackResult = await pool.query(
                `SELECT id, title, content, slug, section
                FROM document_chunks
                ORDER BY id
                LIMIT $1`,
                [limit]
            );
            return fallbackResult.rows as DocumentChunk[];
        }

        return result.rows as DocumentChunk[];
    });
}

// Get all document metadata for navigation
export async function getAllDocuments(): Promise<DocumentMetadata[]> {
    const pool = getPool();

    const result = await pool.query(
        `SELECT DISTINCT title, slug, section
        FROM document_chunks
        ORDER BY section, title`
    );

    return result.rows as DocumentMetadata[];
}

// Get document by slug
export async function getDocumentBySlug(slug: string) {
    const pool = getPool();

    const result = await pool.query(
        `SELECT title, content, slug, section
        FROM document_chunks
        WHERE slug = $1
        ORDER BY id`,
        [slug]
    );

    return result.rows;
}
