import { AppHeader } from '@/components/layout/app-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, MessageSquare, Sparkles } from 'lucide-react';

const placeholders = [
  {
    title: 'Documents',
    description: 'Upload PDFs and text files to build your knowledge base.',
    icon: FileText,
  },
  {
    title: 'Conversations',
    description: 'Ask questions and get answers grounded in your documents.',
    icon: MessageSquare,
  },
  {
    title: 'AI Assistant',
    description: 'Context-aware responses powered by your uploaded content.',
    icon: Sparkles,
  },
];

export default function DashboardPage() {
  return (
    <>
      <AppHeader
        title="Dashboard"
        description="Your AI document workspace is ready."
      />
      <section className="space-y-8 p-8">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 transition-shadow duration-200 hover:shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Welcome to AIChat</CardTitle>
            <CardDescription>
              Upload documents, start conversations, and get instant answers from
              your content. Features below will unlock as you build out the
              platform.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {placeholders.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="space-y-4">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
