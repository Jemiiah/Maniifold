import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';

const Providers = dynamic(() => import('@/components/providers').then(mod => mod.Providers), {
  ssr: false,
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BlockSeer - Blockchain Prediction Markets',
  description: 'Trade on crypto events with zero-knowledge privacy on Aleo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-[hsl(230,15%,5%)]">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_top_left,hsla(217,70%,25%,0.12),transparent_70%)]" />
              <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_right,hsla(263,60%,25%,0.10),transparent_70%)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,hsla(190,60%,30%,0.04),transparent_70%)]" />
            </div>
            <div className="relative">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
