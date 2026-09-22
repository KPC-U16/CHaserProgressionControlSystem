'use client';
import { useState } from 'react';
import { reasons, reasonLabels, type Command, type ControlState, type Game, type Match } from '@chros/shared';
import { evaluateGame, evaluateMatch, playerName } from '@chros/scoring';
export type Send = (command: Command) => Promise<boolean>;
export const statusLabels: Record<string, string> = { pending: '未開始', running: '対戦中', finished: '確定', replay: '再試合待ち' };

function GameForm({ state, match, number, send, onSaved }: { state: ControlState; match: Match; number: 1 | 2; send: Send; onSaved: () => void }) {
  const existing = match.games.find(g => g.number === number);
  const [game, setGame] = useState<Game>(existing ?? { number, scoreA: 0, scoreB: 0, reason: 'points', specialWinner: null, remainingTurns: 0 });
  const [scoreInputs, setScoreInputs] = useState({ a: existing ? String(existing.scoreA) : '', b: existing ? String(existing.scoreB) : '' });
  const [turnsInput, setTurnsInput] = useState(existing ? String(existing.remainingTurns) : '');
  const [correction, setCorrection] = useState('');
  const result = evaluateGame(game, state.profile);
  const cool = number === 1 ? match.firstCool : match.firstCool === match.a ? match.b : match.a;
  const set = (patch: Partial<Game>) => setGame(current => ({ ...current, ...patch }));
  return <form className="game-form" onSubmit={async event => { event.preventDefault(); if (await send({ type: 'save-game', matchId: match.id, game, correction })) onSaved(); }}>
    <div className="game-form-top"><b>第{number}戦の結果</b><span>{number === 2 ? '先攻・後攻を入れ替え' : 'じゃんけんで決めた先攻・後攻'}</span></div>
    <div className="score-inputs">{(['a', 'b'] as const).map(side => <label key={side} className={`score-input score-input-${side}`}><span className="side-badge">{match[side] === cool ? 'COOL · 先攻' : 'HOT · 後攻'}</span><strong>{playerName(state, match[side])}</strong><div><input aria-label={`第${number}戦 ${playerName(state, match[side])}の得点`} type="number" required min="0" max="999" placeholder="—" value={scoreInputs[side]} onChange={event => { setScoreInputs(current => ({ ...current, [side]: event.target.value })); set({ [side === 'a' ? 'scoreA' : 'scoreB']: Number(event.target.value) }); }} /><span>点</span></div></label>)}</div>
    <div className="form-grid"><label>勝因<select value={game.reason} onChange={event => set({ reason: event.target.value as Game['reason'], specialWinner: event.target.value === 'points' ? null : game.specialWinner })}>{reasons.map(reason => <option value={reason} key={reason}>{reasonLabels[reason]}</option>)}</select></label>
      {game.reason !== 'points' && <label>勝利した参加者<select required value={game.specialWinner ?? ''} onChange={event => set({ specialWinner: event.target.value as 'a' | 'b' })}><option value="" disabled>勝者を選択</option><option value="a">{playerName(state, match.a)}</option><option value="b">{playerName(state, match.b)}</option></select></label>}
      {state.profile === 'asahikawa' && !['points', 'put', 'surround'].includes(game.reason) && <label>終了時の残りターン<input type="number" min="0" max="999" required value={turnsInput} onChange={event => { setTurnsInput(event.target.value); set({ remainingTurns: Number(event.target.value) }); }} /></label>}
    </div>
    <div className="calculation-preview"><span>この戦の判定</span><strong>{!scoreInputs.a || !scoreInputs.b ? '両者の得点を入力してください' : result.winner ? `${playerName(state, match[result.winner])} の勝利` : game.reason === 'points' ? '同点' : '勝者を選択してください'}</strong><small>{game.reason !== 'points' ? '勝者に特殊ポイント +1' : '特殊ポイントなし'}{state.profile === 'asahikawa' ? ` · 換算得点 ${result.a.points} : ${result.b.points}` : ''}</small></div>
    {existing && <label>訂正理由 <span className="required">必須</span><input required value={correction} maxLength={300} placeholder="例：記録用紙と照合し、入力値を訂正" onChange={event => setCorrection(event.target.value)} /></label>}
    <div className="form-bottom"><small>{existing ? '変更前の結果と理由を履歴に残します' : '保存すると掲示と集計に反映されます'}</small><button className="button primary" type="submit">{existing ? '訂正を保存' : `第${number}戦を記録`} <span>↗</span></button></div>
  </form>;
}

export default function MatchEditor({ state, match, send }: { state: ControlState; match: Match; send: Send }) {
  const [number, setNumber] = useState<1 | 2>(match.games.length === 1 ? 2 : 1);
  const [firstCool, setFirstCool] = useState('');
  const [replayOpen, setReplayOpen] = useState(false), [replayReason, setReplayReason] = useState('');
  const result = evaluateMatch(match, state.profile);
  const locked = match.stage === 'qualifying' && state.matches.some(m => m.stage === 'finals');
  return <div className="match-editor">
    <div className="section-heading"><div><span className="eyebrow">MATCH RECORD / {match.label}</span><h3>{playerName(state, match.a)} <span className="muted">vs</span> {playerName(state, match.b)}</h3></div><span className={`status status-${result.status}`}>{statusLabels[result.status]}</span></div>
    {match.attempt > 1 && <div className="notice">再試合 {match.attempt - 1} 回目 · 以前の結果は無効として保管しています。</div>}
    {result.winnerId && <div className="result-summary"><span className="result-trophy">↗</span><div><small>MATCH WINNER</small><strong>{playerName(state, result.winnerId)}</strong><span>{result.decidedBy}で勝利 · 特殊P {result.a.special}–{result.b.special} / 合計得点 {result.a.points}–{result.b.points}</span></div></div>}
    {result.tied && <div className="notice warning">2戦合計が同値です。新しいマップで両戦を仕切り直してください。</div>}
    {match.bye ? <p className="muted">不戦進出として次の試合へ反映済みです。</p> : !match.a || !match.b ? <div className="empty-state">前の試合の勝者が確定すると、対戦者が入ります。</div> : !match.started ? <form className="start-form" onSubmit={async event => { event.preventDefault(); await send({ type: 'start-match', matchId: match.id, firstCool }); }}><p>じゃんけんの結果に従って、第1戦の先攻を登録します。第2戦は自動で入れ替わります。</p><label>第1戦の COOL・先攻<select required value={firstCool} onChange={event => setFirstCool(event.target.value)}><option value="" disabled>参加者を選択</option><option value={match.a}>{playerName(state, match.a)}</option><option value={match.b}>{playerName(state, match.b)}</option></select></label><button className="button primary" disabled={locked} type="submit">試合を開始する →</button></form> : <>
      <div className="game-tabs">{([1, 2] as const).map(n => <button type="button" key={n} className={number === n ? 'active' : ''} onClick={() => setNumber(n)} disabled={n === 2 && !match.games.some(g => g.number === 1)}>第{n}戦 <span>{match.games.some(g => g.number === n) ? '記録済み ✓' : '未記録'}</span></button>)}</div>
      {locked ? <div className="notice">本戦の組み合わせ確定済みのため、予選結果は保護されています。</div> : <GameForm key={`${match.id}-${match.attempt}-${number}-${JSON.stringify(match.games.find(g => g.number === number))}`} state={state} match={match} number={number} send={send} onSaved={() => { if (number === 1 && !match.games.some(g => g.number === 2)) setNumber(2); }} />}
      {!locked && <div className="replay-area"><button className="text-button" type="button" onClick={() => setReplayOpen(!replayOpen)}>両戦を仕切り直す</button>{replayOpen && <form onSubmit={async event => { event.preventDefault(); if (await send({ type: 'replay', matchId: match.id, reason: replayReason })) { setReplayOpen(false); setReplayReason(''); setNumber(1); setFirstCool(''); } }}><label>仕切り直しの理由<input required maxLength={300} value={replayReason} onChange={event => setReplayReason(event.target.value)} placeholder="同点、サーバー不具合など" /></label><p>現在の両戦の結果を無効にし、先攻の登録からやり直します。履歴は残ります。</p><button className="button danger" type="submit">理由を記録して仕切り直す</button></form>}</div>}
    </>}
  </div>;
}
