import GlobalSidebar from '@/components/layout/GlobalSidebar';
import GlobalHeader from '@/components/layout/GlobalHeader';
import CommandPalette from '@/components/shared/CommandPalette';
import GatewayProvider from '@/components/layout/GatewayProvider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-300 antialiased min-h-screen flex">
        <GatewayProvider>
          <CommandPalette />
          <GlobalSidebar />
          <div className="flex-1 flex flex-col">
            <GlobalHeader />
            <main className="flex-1 p-6 overflow-auto ml-0 md:ml-64 relative z-0">
              {children}
            </main>
          </div>
        </GatewayProvider>
      </body>
    </html>
  );
}