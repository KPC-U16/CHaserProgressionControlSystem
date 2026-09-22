'use client';
import type { ChangeEvent } from 'react';

import type { ControlProps } from '@/lib/control-types';
import { useState } from 'react';

export function LogoSettings({ state, send }: ControlProps) {
  const [uploadError, setUploadError] = useState('');
  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (file.size > 1_000_000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setUploadError('PNG・JPEG・WebPの1 MB以下の画像を選んでください。');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setUploadError('画像を読み込めませんでした。');
    reader.onload = () => {
      void send({ type: 'logo', data: String(reader.result) });
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>幕間のロゴ</h2>
      </div>
      <div className="stack-form">
        {state.logo && <img className="logo-thumbnail" src={state.logo} alt="登録中の大会ロゴ" />}
        <label className="upload-box">
          ＋ ロゴ画像を選ぶ<small>PNG / JPEG / WebP · 1 MBまで</small>
          <input
            aria-label="幕間ロゴ画像"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={uploadLogo}
          />
        </label>
        {uploadError && (
          <p className="danger-text" role="alert">
            {uploadError}
          </p>
        )}
        {state.logo && (
          <button
            className="text-button"
            type="button"
            onClick={() => send({ type: 'logo', data: null })}
          >
            標準ロゴに戻す
          </button>
        )}
      </div>
    </section>
  );
}
