import Groq from 'groq-sdk';
import { retrieveContext, buildSystemPrompt } from '@/lib/ai/rag';

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

// Disable edge runtime - use Node.js for database access
export const dynamic = 'force-dynamic';
// Set maximum duration to 120 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Get the latest user message
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        // Retrieve relevant context using RAG
        const context = await retrieveContext(userQuery);
        console.log(`📚 Retrieved ${context.length} context chunks for query: "${userQuery}"`);

        // Log the retrieved context to prove it's from YOUR documents
        if (context.length > 0) {
            console.log('📄 === CONTEXT FROM YOUR DOCUMENTS ===');
            context.forEach((c, i) => {
                console.log(`--- Document ${i + 1}: ${c.title} (${c.section}) ---`);
                console.log(c.content.substring(0, 300) + '...');
            });
            console.log('📄 === END CONTEXT ===');
        } else {
            console.log('⚠️ No documents found - AI will use generic response');
        }

        // Build the system prompt with context
        const systemPrompt = buildSystemPrompt(context);

        // Stream the AI response using Groq
        const chatCompletion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant', // Fast and efficient model
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content }))
            ],
            max_tokens: 1000,
            temperature: 0.7,
            stream: true,
        });

        console.log('✨ Streaming response started');

        // Create a ReadableStream for streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of chatCompletion) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                } catch (error) {
                    console.error('Stream error:', error);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error('Chat API error:', error);

        return new Response(
            JSON.stringify({ error: 'Failed to process request', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
