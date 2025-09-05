import { ReactNode } from 'react';
import DisplayPreview from './components/DisplayPreview';
import NextDisplayControl from './components/NextDisplayControl';
import ConsoleNavTabs from './components/ConsoleNavTabs';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* 左：表示ビュー & 操作 */}
      <aside className="w-[60%] bg-gray-100 p-6 flex flex-col gap-6">
        <h1 className="text-4xl font-bold text-gray-900">表示管理</h1>
        <DisplayPreview />
        <NextDisplayControl />
      </aside>

      {/* 右：タブで切り替える内容 */}
      <main className="w-[40%] p-6 overflow-y-auto bg-white">
        <ConsoleNavTabs />
        <div className="mt-4">{children}</div>
      </main>
    </div>
  );
}
