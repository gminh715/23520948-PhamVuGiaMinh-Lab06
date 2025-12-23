/**
 * Import Markdown File Script
 * 
 * This script imports markdown documentation files into the database
 * Run with: npm run import:md -- <file-path>
 * 
 * NOTE: This version does NOT use embeddings - only text search
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

/**
 * Generate a dummy embedding (all zeros) since we're using text search only
 */
function generateDummyEmbedding() {
    // Return 1536-dimensional zero vector for database compatibility
    return new Array(1536).fill(0);
}

/**
 * Parse markdown into sections
 */
function parseMarkdownSections(content, filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const title = fileName.replace(/_/g, ' ').replace(/-/g, ' ');
    const slug = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const sections = [];

    // Split by headers (## or ###)
    const headerRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = [...content.matchAll(headerRegex)];

    if (matches.length === 0) {
        // No headers found, treat entire content as one section
        sections.push({
            title: title,
            content: content.trim(),
            slug: slug,
            section: 'main',
        });
        return sections;
    }

    // Extract intro (content before first header)
    const firstHeaderIndex = matches[0].index;
    if (firstHeaderIndex > 0) {
        const introContent = content.substring(0, firstHeaderIndex).trim();
        if (introContent.length > 50) {
            sections.push({
                title: title,
                content: introContent,
                slug: slug,
                section: 'introduction',
            });
        }
    }

    // Extract each section
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const headerText = match[2].trim();
        const startIndex = match.index + match[0].length;
        const endIndex = matches[i + 1]?.index || content.length;

        let sectionContent = content.substring(startIndex, endIndex).trim();

        // Skip if section is too short
        if (sectionContent.length < 30) continue;

        // Create section slug
        const sectionSlug = headerText.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        sections.push({
            title: `${title} - ${headerText}`,
            content: `# ${headerText}\n\n${sectionContent}`,
            slug: `${slug}-${sectionSlug}`,
            section: headerText,
        });
    }

    return sections;
}

/**
 * Main import function
 */
async function importMarkdownFile(filePath) {
    console.log('📂 Import Markdown File to Database\n');
    console.log(`📄 File: ${filePath}\n`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`📖 Read ${content.length} characters\n`);

    // Parse sections
    const sections = parseMarkdownSections(content, filePath);
    console.log(`📑 Found ${sections.length} sections to import\n`);

    // Connect to database
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Optional: Clear existing data from same source
        const baseSlug = path.basename(filePath, path.extname(filePath))
            .toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const deleteResult = await client.query(
            'DELETE FROM document_chunks WHERE slug LIKE $1',
            [`${baseSlug}%`]
        );

        if (deleteResult.rowCount > 0) {
            console.log(`🗑️  Cleared ${deleteResult.rowCount} existing chunks\n`);
        }

        // Import each section
        let imported = 0;
        for (const section of sections) {
            process.stdout.write(`⏳ Importing: ${section.section.substring(0, 40)}...`);

            try {
                // Generate dummy embedding (we use text search, not vector search)
                const embedding = generateDummyEmbedding();

                // Insert into database
                await client.query(
                    `INSERT INTO document_chunks (title, content, slug, section, embedding)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        section.title,
                        section.content,
                        section.slug,
                        section.section,
                        `[${embedding.join(',')}]`
                    ]
                );

                imported++;
                console.log(' ✅');

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.log(' ❌');
                console.error(`   Error: ${error.message}`);
            }
        }

        console.log(`\n🎉 Successfully imported ${imported}/${sections.length} sections!`);

        // Show sample query
        console.log('\n📊 Verifying import...');
        const countResult = await client.query('SELECT COUNT(*) FROM document_chunks');
        console.log(`   Total chunks in database: ${countResult.rows[0].count}`);

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Get file path from command line arguments
const args = process.argv.slice(2);
const filePath = args[0] || './premier_league_rankings_knowledge_base_1992_2025.md';

// Resolve to absolute path
const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

importMarkdownFile(absolutePath);
