'use client';

export function AskAIButton({ className }: { className?: string }) {
    return (
        <button
            className={className}
            onClick={() => {
                const event = new CustomEvent('openAIWidget');
                window.dispatchEvent(event);
            }}
        >
            Ask AI ✨
        </button>
    );
}
