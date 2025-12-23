/**
 * Database Setup Script
 * 
 * This script creates the necessary tables and indexes for the AI Knowledge Base.
 * Run with: npm run db:setup
 */

import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function setupDatabase() {
    console.log('🔧 Setting up database...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Enable pgvector extension
        console.log('📦 Enabling pgvector extension...');
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('✅ pgvector extension enabled\n');

        // Create documents table
        console.log('📄 Creating document_chunks table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        slug VARCHAR(255) NOT NULL,
        section VARCHAR(255) NOT NULL,
        embedding vector(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ document_chunks table created\n');

        // Create vector index for similarity search
        console.log('🔍 Creating vector similarity index...');
        try {
            await client.query(`
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
        ON document_chunks 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
            console.log('✅ Vector index created\n');
        } catch (error) {
            // Index creation might fail if table is empty
            console.log('⚠️  Vector index will be created after data is seeded\n');
        }

        // Create rate limiting table
        console.log('🚦 Creating rate_limits table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        ip_address VARCHAR(45) PRIMARY KEY,
        request_count INTEGER DEFAULT 1,
        window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ rate_limits table created\n');

        console.log('🎉 Database setup complete!');
        console.log('\nNext steps:');
        console.log('1. Run npm run db:seed to populate with sample documentation');
        console.log('2. Start the dev server with npm run dev');
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

setupDatabase();
