export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-background p-6">
      {children}
    </section>
  );
}
