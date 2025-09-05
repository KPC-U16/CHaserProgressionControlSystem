'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/console', label: 'ホーム' },
  { href: '/console/scores', label: 'スコア' },
  { href: '/console/users', label: 'ユーザー' },
  { href: '/console/matches', label: 'マッチ' },
];

export default function ConsoleNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b pb-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-2 py-1 ${
            pathname === tab.href ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
