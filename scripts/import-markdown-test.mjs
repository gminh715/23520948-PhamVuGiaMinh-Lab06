/**
 * Import Markdown File Script (No Embedding Version)
 * 
 * This script imports markdown documentation files into the database
 * WITHOUT generating embeddings. Useful for testing when OpenAI quota is exceeded.
 * 
 * Run with: npm run import:md:test
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

/**
 * Generate fake embedding (1536 zeros)
 */
function generateFakeEmbedding() {
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
        sections.push({
            title: title,
            content: content.trim(),
            slug: slug,
            section: 'main',
        });
        return sections;
    }

    // Extract intro
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

        if (sectionContent.length < 30) continue;

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
    console.log('📂 Import Markdown File (Test Mode - No Embeddings)\n');
    console.log(`📄 File: ${filePath}\n`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`📖 Read ${content.length} characters\n`);

    const sections = parseMarkdownSections(content, filePath);
    console.log(`📑 Found ${sections.length} sections to import\n`);

    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        const baseSlug = path.basename(filePath, path.extname(filePath))
            .toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const deleteResult = await client.query(
            'DELETE FROM document_chunks WHERE slug LIKE $1',
            [`${baseSlug}%`]
        );

        if (deleteResult.rowCount > 0) {
            console.log(`🗑️  Cleared ${deleteResult.rowCount} existing chunks\n`);
        }

        let imported = 0;
        for (const section of sections) {
            process.stdout.write(`⏳ Importing: ${section.section.substring(0, 40)}...`);

            try {
                const fakeEmbedding = generateFakeEmbedding();

                await client.query(
                    `INSERT INTO document_chunks (title, content, slug, section, embedding)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        section.title,
                        section.content,
                        section.slug,
                        section.section,
                        `[${fakeEmbedding.join(',')}]`
                    ]
                );

                imported++;
                console.log(' ✅');
            } catch (error) {
                console.log(' ❌');
                console.error(`   Error: ${error.message}`);
            }
        }

        console.log(`\n🎉 Successfully imported ${imported}/${sections.length} sections!`);

        // Show imported content
        console.log('\n📊 Imported sections:');
        const result = await client.query('SELECT id, title, section FROM document_chunks ORDER BY id');
        result.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. ${row.section}`);
        });

        console.log('\n⚠️  Note: Embeddings are placeholders. Run "npm run import:md" when OpenAI quota is available.');

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

const filePath = './premier_league_rankings_knowledge_base_1992_2025.md';
const absolutePath = path.resolve(process.cwd(), filePath);

importMarkdownFile(absolutePath);
