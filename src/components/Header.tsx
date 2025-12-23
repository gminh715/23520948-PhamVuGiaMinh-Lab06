'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Header() {
    return (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/epl-logo.png"
                        alt="Premier League Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                    />
                    <span className="font-bold text-xl text-slate-800 dark:text-white">
                        Premier League AI Assistant
                    </span>
                </Link>
            </div>
        </header>
    );
}
