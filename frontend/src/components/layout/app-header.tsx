export function AppHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-sm md:px-8 md:py-6">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
