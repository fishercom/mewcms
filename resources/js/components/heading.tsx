export default function Heading({ title, description }: { title: string; description?: string | null }) {
    return (
        <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {description && <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>}
        </div>
    );
}

