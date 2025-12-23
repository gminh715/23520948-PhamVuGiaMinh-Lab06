import { searchDocumentsByText } from '@/lib/db/schema';

export interface RAGContext {
    content: string;
    title: string;
    section: string;
    slug: string;
}

// Retrieve relevant context from the knowledge base using text search
export async function retrieveContext(query: string): Promise<RAGContext[]> {
    try {
        // Use text search (no embedding needed - saves API calls!)
        const results = await searchDocumentsByText(query, 5);
        console.log(`🔍 Text search found ${results.length} results`);
        return results.map((doc) => ({
            content: doc.content,
            title: doc.title,
            section: doc.section,
            slug: doc.slug,
        }));
    } catch (error) {
        console.error('Text search failed:', error);
        return [];
    }
}

// Build the system prompt with retrieved context
export function buildSystemPrompt(context: RAGContext[]): string {
    const contextText = context
        .map((c) => `### ${c.title} (${c.section})\n${c.content}`)
        .join('\n\n---\n\n');

    if (context.length === 0) {
        return `You are an AI assistant for Premier League knowledge base (1992-2025).
You help users learn about English Premier League history, champions, rankings, and memorable moments.

Unfortunately, I couldn't find specific information for this query in the database.
Please try asking about:
- Premier League champions by year
- Team statistics and title wins
- Famous moments like "Invincibles" or "Aguero moment"
- Relegation and promotion rules

Answer in a helpful way and suggest what information is available.`;
    }

    return `You are an AI assistant for Premier League knowledge base (1992-2025).
Your role is to help users learn about English Premier League history using the provided context.

IMPORTANT RULES:
1. ONLY use information from the CONTEXT below to answer questions
2. If the answer is in the context, provide it clearly with details
3. Mention specific seasons, teams, and facts from the context
4. Use markdown formatting for better readability
5. Be enthusiastic about football history!

CONTEXT FROM KNOWLEDGE BASE:
${contextText}

---

Now answer the user's question based ONLY on the above context. Be specific and cite the information.`;
}
