'use server';

import { retrieveContext, RAGContext } from '@/lib/ai/rag';
import { insertDocumentChunk, getAllDocuments, getDocumentBySlug } from '@/lib/db/schema';

// Server Action: Get relevant context for a user query
export async function getQueryContext(query: string): Promise<RAGContext[]> {
    if (!query.trim()) {
        return [];
    }

    try {
        const context = await retrieveContext(query);
        return context;
    } catch (error) {
        console.error('Error retrieving context:', error);
        return [];
    }
}

// Server Action: Add new documentation to the knowledge base
export async function addDocumentation(formData: FormData) {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const slug = formData.get('slug') as string;
    const section = formData.get('section') as string;

    if (!title || !content || !slug || !section) {
        return { success: false, error: 'All fields are required' };
    }

    try {
        // Insert into database with dummy embedding (we use text search only)
        const dummyEmbedding = new Array(1536).fill(0);

        // Insert into database
        await insertDocumentChunk(title, content, slug, section, dummyEmbedding);

        return { success: true };
    } catch (error) {
        console.error('Error adding documentation:', error);
        return { success: false, error: 'Failed to add documentation' };
    }
}

// Server Action: Get all documentation for navigation
export async function getDocumentationNav() {
    try {
        const docs = await getAllDocuments();

        // Group by section
        const grouped = docs.reduce((acc, doc) => {
            if (!acc[doc.section]) {
                acc[doc.section] = [];
            }
            acc[doc.section].push({ title: doc.title, slug: doc.slug });
            return acc;
        }, {} as Record<string, { title: string; slug: string }[]>);

        return { success: true, data: grouped };
    } catch (error) {
        console.error('Error fetching documentation nav:', error);
        return { success: false, error: 'Failed to fetch navigation', data: {} };
    }
}

// Server Action: Get single document content
export async function getDocumentContent(slug: string) {
    try {
        const chunks = await getDocumentBySlug(slug);

        if (chunks.length === 0) {
            return { success: false, error: 'Document not found' };
        }

        // Combine all chunks for this document
        const content = chunks.map((c) => c.content).join('\n\n');
        const title = chunks[0].title;
        const section = chunks[0].section;

        return { success: true, data: { title, content, section, slug } };
    } catch (error) {
        console.error('Error fetching document:', error);
        return { success: false, error: 'Failed to fetch document' };
    }
}
