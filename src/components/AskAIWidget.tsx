'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function AskAIWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Listen for custom event to open the widget
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('openAIWidget', handleOpen);
        return () => window.removeEventListener('openAIWidget', handleOpen);
    }, []);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setError(null);

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // Add placeholder for assistant response
        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;

                // Update the assistant message with streamed content
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantId
                            ? { ...msg, content: fullContent }
                            : msg
                    )
                );
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            // Remove empty assistant message on error
            setMessages(prev => prev.filter(msg => msg.id !== assistantId));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${isOpen
                    ? 'bg-slate-600 rotate-45'
                    : 'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 hover:to-primary-600'
                    }`}
                aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
            >
                {isOpen ? (
                    <span className="text-white text-2xl">+</span>
                ) : (
                    <span className="text-white text-2xl">✨</span>
                )}
            </button>

            {/* Chat Widget */}
            <div
                className={`fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span>✨</span> Ask AI
                    </h3>
                    <p className="text-primary-100 text-sm">
                        Ask questions about our documentation
                    </p>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                            <p className="text-4xl mb-4">🤖</p>
                            <p>Hi! I&apos;m your AI assistant.</p>
                            <p className="text-sm mt-2">Ask me anything about the documentation.</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                    ? 'bg-primary-600 text-white rounded-br-md'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow rounded-bl-md'
                                    }`}
                            >
                                {message.role === 'assistant' ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p>{message.content}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-2 shadow">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error.message.includes('Rate limit')
                                ? '⏱️ Rate limit exceeded. Please wait a moment.'
                                : '❌ Something went wrong. Please try again.'}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t dark:border-slate-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-800 dark:text-slate-200"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5"
                            >
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
