'use client';
import type { FormEvent } from 'react';

import type { ControlProps } from '@/lib/control-types';
import { useState } from 'react';

export function TournamentSettings({ state, send }: ControlProps) {
  const [title, setTitle] = useState(state.title);
  const [subtitle, setSubtitle] = useState(state.subtitle);
  const [profile, setProfile] = useState(state.profile);
  const [advance, setAdvance] = useState(state.advancePerGroup);
  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send({ type: 'settings', title, subtitle, profile, advancePerGroup: advance });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">TOURNAMENT</span>
          <h2>大会の設定</h2>
        </div>
      </div>
      <form className="stack-form" onSubmit={saveSettings}>
        <label>
          大会名
          <input
            required
            maxLength={60}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          サブタイトル
          <input
            maxLength={120}
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
          />
        </label>
        <label>
          計算方式
          <select
            disabled={state.matches.some((match) => match.started)}
            value={profile}
            onChange={(event) => setProfile(event.target.value as typeof profile)}
          >
            <option value="kushiro">釧路向け · 特殊ポイント → 合計スコア</option>
            <option value="asahikawa">旭川向け · ゲーム勝数 → 換算スコア</option>
          </select>
          <small>試合開始後の変更はできません。詳細は提案書の判断事項を参照。</small>
        </label>
        <label>
          各グループから本戦に進む人数
          <input
            required
            type="number"
            min="1"
            max="8"
            disabled={state.matches.some((match) => match.stage === 'finals')}
            value={advance}
            onChange={(event) => setAdvance(Number(event.target.value))}
          />
        </label>
        <div className="rule-explanation">
          <b>判定の見える化</b>
          <p>
            {profile === 'kushiro'
              ? 'PUT・包囲・相手の自滅による勝利を各1特殊Pとして集計。2戦の特殊Pが多い側、同値なら合計スコアが多い側が勝者です。'
              : '2戦のゲーム勝数を比較し、同値なら換算スコアを比較。PUT・包囲による敗者は0点、通信切断・移動違反・自己包囲による敗者は残りターン数のマイナスに換算します。'}
          </p>
          <p>
            予選順位：試合勝数 → {profile === 'kushiro' ? '特殊P → ' : ''}
            スコア。同順位は主催者が理由を記録して進出を裁定します。
          </p>
        </div>
        <button className="button primary" type="submit">
          設定を保存
        </button>
      </form>
    </section>
  );
}
