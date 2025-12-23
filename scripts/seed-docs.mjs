/**
 * Documentation Seeding Script
 * 
 * This script populates the database with sample documentation chunks
 * and generates embeddings for semantic search.
 * 
 * Run with: npm run db:seed
 */

import 'dotenv/config';
import pg from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

const { Client } = pg;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

// Sample documentation data
const documentation = [
    {
        title: 'Getting Started',
        slug: 'getting-started',
        section: 'Introduction',
        content: `Welcome to the AI Knowledge Base! This platform uses Retrieval-Augmented Generation (RAG) to provide intelligent answers to your questions based on documentation content. Key features include semantic search using natural language queries, AI-powered answers that synthesize information from multiple sources, real-time streaming responses, and SEO-optimized static documentation pages. The platform is built with Next.js 15, Vercel AI SDK, PostgreSQL with pgvector, and Tailwind CSS.`,
    },
    {
        title: 'Installation Guide',
        slug: 'installation',
        section: 'Introduction',
        content: `To install the AI Knowledge Base, first clone the repository and install dependencies using npm install. Copy the .env.example file to .env.local and fill in your environment variables including your PostgreSQL connection string and OpenAI API key. Run npm run db:setup to create the database tables, then npm run db:seed to populate with sample documentation. Finally, start the development server with npm run dev.`,
    },
    {
        title: 'RAG Architecture Overview',
        slug: 'rag-architecture',
        section: 'Core Concepts',
        content: `Retrieval-Augmented Generation (RAG) combines retrieval and generation to provide accurate, grounded answers. The pipeline works as follows: First, documents are split into chunks and embedded using OpenAI's text-embedding-3-small model. When a user asks a question, the query is also embedded and compared against document embeddings using cosine similarity in pgvector. The most relevant chunks are retrieved and assembled into a context window. Finally, GPT-4o-mini generates a response based on this context, which is streamed to the client in real-time.`,
    },
    {
        title: 'Vector Embeddings',
        slug: 'vector-embeddings',
        section: 'Core Concepts',
        content: `Vector embeddings are numerical representations of text that capture semantic meaning. The AI Knowledge Base uses OpenAI's text-embedding-3-small model to generate 1536-dimensional vectors for both documentation chunks and user queries. These vectors are stored in PostgreSQL using the pgvector extension, which provides efficient similarity search using cosine distance. The embedding process converts text into a dense vector space where semantically similar content is positioned close together, enabling natural language search.`,
    },
    {
        title: 'Streaming Responses',
        slug: 'streaming',
        section: 'Core Concepts',
        content: `The AI Knowledge Base uses streaming to deliver responses in real-time, providing immediate feedback as the AI generates each word. This is implemented using the Vercel AI SDK's streamText function, which returns a ReadableStream that can be consumed by the client. The useChat hook on the frontend automatically handles the stream, updating the UI as each chunk arrives. This creates a more engaging, interactive experience compared to waiting for the complete response.`,
    },
    {
        title: 'Chat API Reference',
        slug: 'api-chat',
        section: 'API Reference',
        content: `The Chat API endpoint at POST /api/chat accepts a JSON body with a messages array following the OpenAI chat format. Each message has a role (user or assistant) and content (the message text). The API uses Edge Runtime for optimal performance and returns a streaming response using Server-Sent Events. Rate limiting is applied via Edge Middleware with default limits of 10 requests per 60-second window. Response headers include X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After for rate limit management.`,
    },
    {
        title: 'Server Actions',
        slug: 'server-actions',
        section: 'API Reference',
        content: `Server Actions in the AI Knowledge Base handle database operations and context retrieval directly from components. The getQueryContext action retrieves relevant documentation chunks for a given query using vector similarity search. The addDocumentation action allows adding new content to the knowledge base with automatic embedding generation. The getDocumentationNav action returns grouped navigation data for the sidebar. These actions are defined with 'use server' directive and can be imported and called directly from client components.`,
    },
    {
        title: 'Rate Limiting',
        slug: 'rate-limiting',
        section: 'API Reference',
        content: `Rate limiting protects the AI API from abuse using Edge Middleware. The default configuration allows 10 requests per 60-second sliding window per IP address. Configuration is done via environment variables RATE_LIMIT_REQUESTS and RATE_LIMIT_WINDOW_MS. When rate limited, users receive a 429 response with error details and Retry-After header. For production deployments with multiple instances, consider using Redis (like Upstash) for distributed rate limiting instead of in-memory storage.`,
    },
    {
        title: 'Database Schema',
        slug: 'database-schema',
        section: 'Technical Details',
        content: `The AI Knowledge Base uses PostgreSQL with pgvector extension for vector storage. The main table document_chunks stores id (serial primary key), title (varchar), content (text), slug (varchar), section (varchar), embedding (vector 1536 dimensions), and created_at (timestamp). An IVFFlat index on the embedding column enables fast similarity search. The rate_limits table tracks API usage with ip_address (primary key), request_count (integer), and window_start (timestamp).`,
    },
    {
        title: 'Deployment Guide',
        slug: 'deployment',
        section: 'Technical Details',
        content: `To deploy the AI Knowledge Base to Vercel, first push your code to GitHub. Create a new project on Vercel and link your repository. Add environment variables in the Vercel dashboard: POSTGRES_URL for your database connection, OPENAI_API_KEY for AI functionality, and rate limiting settings. Vercel will automatically detect Next.js and configure the build. The Edge Middleware for rate limiting will run on Vercel's edge network for low-latency protection worldwide.`,
    },
];

async function generateEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    // Pad to 1536 dimensions for database compatibility
    return [...embedding, ...new Array(1536 - embedding.length).fill(0)];
}

async function seedDatabase() {
    console.log('🌱 Seeding database with documentation...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Clear existing data
        console.log('🗑️  Clearing existing documentation...');
        await client.query('DELETE FROM document_chunks');
        console.log('✅ Cleared existing data\n');

        // Insert documentation with embeddings
        for (const doc of documentation) {
            console.log(`📝 Processing: ${doc.title}`);

            // Generate embedding
            const embedding = await generateEmbedding(doc.content);
            const embeddingStr = `[${embedding.join(',')}]`;

            // Insert into database
            await client.query(
                `INSERT INTO document_chunks (title, content, slug, section, embedding)
                 VALUES ($1, $2, $3, $4, $5)`,
                [doc.title, doc.content, doc.slug, doc.section, embeddingStr]
            );

            console.log(`✅ Added: ${doc.title}`);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n🎉 Database seeding complete!');
        console.log(`📊 Total documents: ${documentation.length}`);
        console.log('\nYou can now start the dev server with npm run dev');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seedDatabase();
