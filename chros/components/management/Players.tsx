'use client';
import type { FormEvent } from 'react';

import { clientId } from '@/lib/client-id';
import type { ControlProps } from '@/lib/control-types';
import { groupNames } from '@chros/scoring';
import type { Player } from '@chros/shared';
import { useState } from 'react';
import { useConfirmation } from '../Confirmation';

export function Players({ state, send }: ControlProps) {
  const confirm = useConfirmation();
  const fresh = (): Player => ({ id: clientId(), name: '', affiliation: '', group: 'A' });
  const [draft, setDraft] = useState<Player>(fresh);
  const editing = state.players.some((player) => player.id === draft.id);
  async function removePlayer(player: Player) {
    if (await confirm(`${player.name}を参加者から削除しますか？`))
      void send({ type: 'remove-player', playerId: player.id });
  }

  async function createQualifyingMatches() {
    if (
      await confirm(
        '現在の参加者とグループで予選を作成します。以降、参加者の追加・削除とグループ変更はできません。作成しますか？',
      )
    )
      void send({ type: 'generate-qualifying' });
  }

  async function savePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await send({ type: 'save-player', player: draft })) setDraft(fresh());
  }

  return (
    <div className="management-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PARTICIPANTS</span>
            <h2>
              挑戦者たち <span className="count-pill">{state.players.length}</span>
            </h2>
          </div>
          <span className="muted">{groupNames(state).length} グループ</span>
        </div>
        {state.players.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>参加者</th>
                  <th>所属</th>
                  <th>組</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.players.map((player) => (
                  <tr key={player.id}>
                    <td>
                      <strong>{player.name}</strong>
                    </td>
                    <td>{player.affiliation || '–'}</td>
                    <td>
                      <span className="group-badge">{player.group}</span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setDraft(player)}
                      >
                        編集
                      </button>
                      {!state.matches.length && (
                        <button
                          className="text-button danger-text"
                          type="button"
                          onClick={() => removePlayer(player)}
                        >
                          削除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            まず参加者を登録しましょう。
            <small>グループをすべて「A」にすると、全員で総当たりになります。</small>
          </div>
        )}
        <div className="panel-footer">
          <p>
            {state.matches.length
              ? '組み合わせ作成済み · 表示名と所属は編集できます。'
              : '各グループの全員が1回ずつ対戦します。1試合は先攻・後攻を入れ替える2戦です。'}
          </p>
          <button
            className="button primary"
            disabled={!!state.matches.length || state.players.length < 2}
            type="button"
            onClick={createQualifyingMatches}
          >
            予選の組み合わせを作成 →
          </button>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ENTRY</span>
            <h2>{editing ? '参加者を編集' : '参加者を追加'}</h2>
          </div>
        </div>
        <form className="stack-form" onSubmit={savePlayer}>
          <label>
            表示名
            <input
              required
              maxLength={60}
              value={draft.name}
              placeholder="例：釧路 はる"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label>
            所属
            <input
              maxLength={60}
              value={draft.affiliation}
              placeholder="学校名・チーム名など"
              onChange={(event) => setDraft({ ...draft, affiliation: event.target.value })}
            />
          </label>
          <label>
            予選グループ
            <input
              required
              maxLength={12}
              disabled={!!state.matches.length}
              value={draft.group}
              onChange={(event) => setDraft({ ...draft, group: event.target.value })}
            />
          </label>
          <div className="form-bottom">
            {editing && (
              <button className="text-button" type="button" onClick={() => setDraft(fresh())}>
                新規登録に戻る
              </button>
            )}
            <button
              className="button primary"
              disabled={!editing && !!state.matches.length}
              type="submit"
            >
              {editing ? '変更を保存' : '参加者を追加'} ＋
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
