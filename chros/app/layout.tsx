import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'CHroS — 大会コントロール', description: 'CHaser の対戦記録と大会掲示をひとつに。' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body>{children}</body></html>;
}
