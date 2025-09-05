'use client';

import { useState } from 'react';

export default function NextDisplayControl() {
  const [selected, setSelected] = useState('next-game');

  const options = [
    { label: '試合画面（next-game）', value: 'next-game' },
    { label: 'ランキング表示（ranking）', value: 'ranking' },
    { label: 'ハーフタイム演出（halftime）', value: 'halftime' },
    { label: '広告スライド（ads）', value: 'ads' },
  ];

  return (
    <div className="flex flex-col gap-2 text-gray-800">
      {/* ダミー用ビジュアルボックス */}
      <div className="bg-gray-200 h-32 rounded" />

      <label className="text-sm font-semibold mt-2">表示画面選択</label>
      <select
        className="border border-gray-400 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded">
        変更
      </button>
    </div>
  );
}
