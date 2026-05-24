import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';

const highlights = [
  'Chat with your documents using AI',
  'Secure workspace for every team',
  'Upload, organize, and ask anything',
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-zinc-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.35),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.25),_transparent_55%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 right-0 size-80 rounded-full bg-violet-500/20 blur-3xl"
        />

        <header className="relative z-10">
          <Logo href="/" />
        </header>

        <article className="relative z-10 max-w-md space-y-6">
          <Badge
            variant="secondary"
            className="border-white/10 bg-white/10 text-white hover:bg-white/10"
          >
            AI document workspace
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Turn documents into conversations
          </h1>
          <ul className="space-y-3 text-sm text-zinc-300">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-400" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <footer className="relative z-10 text-xs text-zinc-500">
          Built for teams who work with knowledge
        </footer>
      </section>

      <section className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
