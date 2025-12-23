import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AskAIWidget } from '@/components/AskAIWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'AI Knowledge Base',
    description: 'An AI-powered documentation site with intelligent search and answers',
    keywords: ['documentation', 'AI', 'knowledge base', 'RAG'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} antialiased min-h-screen`} suppressHydrationWarning>
                {children}
                <AskAIWidget />
            </body>
        </html>
    );
}
