import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flow - Deep Work & Pomodoro Productivity',
  description: 'Aplicativo web de produtividade Pomodoro com banco de dados persistente, gestão de projetos, tarefas, timer imersivo e métricas de foco.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-background text-on-background antialiased selection:bg-secondary/20 selection:text-secondary">
        {children}
      </body>
    </html>
  );
}
