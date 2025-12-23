import Image from 'next/image';
import { Header } from '@/components/Header';
import { FeatureCard } from '@/components/FeatureCard';
import { AskAIButton } from '@/components/AskAIButton';

export default function HomePage() {
    return (
        <main className="min-h-screen">
            <Header />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 text-white py-24 px-6">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Image
                            src="/epl-logo.png"
                            alt="Premier League Logo"
                            width={60}
                            height={60}
                            className="object-contain"
                        />
                        <h1 className="text-5xl md:text-6xl font-bold animate-fade-in">
                            Premier League AI Assistant
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
                        Ask anything about English Premier League history (1992-2025).
                        Get instant answers about champions, rankings, memorable moments, and more using AI.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <AskAIButton className="bg-white text-purple-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-50 transition-colors shadow-lg" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4">
                        🏆 Your Premier League Encyclopedia
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">
                        Comprehensive data from 1992 to 2025. Ask about champions, historic moments, team statistics, and legendary players.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="🏆"
                            title="33 Years of History"
                            description="Complete Premier League data from 1992 to 2025, covering all champions and memorable seasons."
                        />
                        <FeatureCard
                            icon="⚡"
                            title="Instant Answers"
                            description="Ask about any season, team, or historic moment and get AI-powered answers instantly."
                        />
                        <FeatureCard
                            icon="🔍"
                            title="Smart Search"
                            description="Find information using natural language - no need to remember exact dates or team names."
                        />
                        <FeatureCard
                            icon="📊"
                            title="Statistics & Facts"
                            description="Comprehensive rankings, champions, and key statistics for every season since 1992."
                        />
                        <FeatureCard
                            icon="⭐"
                            title="Legendary Moments"
                            description="Discover historic achievements like Arsenal's Invincibles and Aguero's legendary moment."
                        />
                        <FeatureCard
                            icon="🚀"
                            title="AI-Powered"
                            description="Advanced RAG technology provides accurate, context-aware responses about EPL history."
                        />
                    </div>
                </div>
            </section>

            {/* Getting Started Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        How to Use the AI Assistant
                    </h2>

                    <div className="space-y-8">
                        <div className="flex gap-6 items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Ask About Premier League</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Click "Ask AI" and ask anything: "Who won in 2004?" or "Tell me about Arsenal's Invincibles season".
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">AI Searches EPL History</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Our AI searches through 33 years of Premier League data using advanced vector embeddings.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Get Detailed Answers</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Receive comprehensive answers with facts, statistics, and context from EPL history in real-time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <p className="mb-4">
                        ⚽ Premier League AI Assistant - Powered by Next.js 15, Groq AI, and PostgreSQL
                    </p>
                    <p className="text-sm">
                        © {new Date().getFullYear()} Premier League Knowledge Base. Capstone Project. Data: 1992-2025
                    </p>
                </div>
            </footer>
        </main>
    );
}
