import "./globals.css";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <ThemeToggle />
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              Erasmus English
            </Link>
            <nav className="flex gap-3 text-sm">
              <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/builder">Składanie zdań</Link>
              <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/learn">Nauka</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}