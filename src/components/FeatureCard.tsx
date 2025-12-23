interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">
                {title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
                {description}
            </p>
        </div>
    );
}
