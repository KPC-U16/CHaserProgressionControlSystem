// Use a separate server with CHROS_DATA_DIR pointing to a disposable directory.
// node scripts/smoke-prototype.mjs http://127.0.0.1:3101 --reset-test-data
import assert from 'node:assert/strict';
const url = process.argv[2];
if (!url || process.argv[3] !== '--reset-test-data') throw new Error('専用のテスト用サーバーURLと --reset-test-data を指定してください。対象大会を切り替えます。');
let state = await (await fetch(`${url}/api/state`)).json();
const send = async command => {
  const response = await fetch(`${url}/api/state`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: state.revision, command }) });
  const body = await response.json(); assert.equal(response.status, 200, JSON.stringify(body)); state = body; return body;
};
await send({ type: 'reset', demo: false, confirmation: 'RESET' });
await send({ type: 'settings', title: 'API検証大会', subtitle: '', profile: 'kushiro', advancePerGroup: 2 });
for (let i = 0; i < 6; i++) await send({ type: 'save-player', player: { id: `smoke-${i}`, name: i === 0 ? '=検証選手0' : `検証選手${i}`, affiliation: '', group: i < 3 ? 'A' : 'B' } });
await send({ type: 'generate-qualifying' });
assert.equal(state.matches.length, 6);
const abort = new AbortController();
const stream = await fetch(`${url}/api/stream`, { signal: abort.signal });
assert.match(stream.headers.get('content-type'), /text\/event-stream/);
const reader = stream.body.getReader(), decoder = new TextDecoder();
const readSnapshot = async () => {
  let text = '';
  while (!text.includes('\n\n')) { const { value, done } = await reader.read(); assert.equal(done, false); text += decoder.decode(value, { stream: true }); }
  return JSON.parse(text.split('\n').find(line => line.startsWith('data: ')).slice(6));
};
assert.equal((await readSnapshot()).revision, state.revision);
const revision = state.revision;
await send({ type: 'show', scene: 'match', phase: 'qualifying' });
assert.equal((await readSnapshot()).scene, 'match');
abort.abort();
const conflict = await fetch(`${url}/api/state`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: revision, command: { type: 'show', scene: 'logo', phase: 'break' } }) });
assert.equal(conflict.status, 409);
assert.equal((await conflict.json()).state.revision, state.revision);
const crossOrigin = await fetch(`${url}/api/state`, { method: 'POST', headers: { Origin: 'https://unrelated.example', 'Content-Type': 'application/json' }, body: '{}' });
assert.equal(crossOrigin.status, 403);
const score = number => ({ number, scoreA: 20, scoreB: 10, reason: 'points', specialWinner: null, remainingTurns: 0 });
const complete = async id => {
  const match = state.matches.find(m => m.id === id);
  await send({ type: 'start-match', matchId: id, firstCool: match.b });
  for (const number of [1, 2]) await send({ type: 'save-game', matchId: id, game: score(number), correction: '' });
};
for (const match of [...state.matches]) await complete(match.id);
await send({ type: 'generate-finals', qualifiers: ['smoke-0', 'smoke-3', 'smoke-1', 'smoke-4'], justification: '' });
assert.equal(state.matches.filter(m => m.stage === 'finals').length, 3);
for (const match of state.matches.filter(m => m.round === 1)) await complete(match.id);
let final = state.matches.find(m => m.label === '決勝'); assert.equal(final.a, 'smoke-0'); assert.equal(final.b, 'smoke-3');
await complete(final.id);
await send({ type: 'select-match', matchId: final.id });
await send({ type: 'show', scene: 'result', phase: 'finals' });
const csv = await (await fetch(`${url}/api/export?format=csv`)).text();
assert.ok(csv.includes('"\'=検証選手0"')); assert.ok(csv.includes('"決勝"')); assert.equal(csv.split('\r\n').length, 19);
const exported = await (await fetch(`${url}/api/export`)).json();
assert.equal(exported.revision, state.revision); assert.equal(exported.audit.length, state.audit.length);
assert.equal((await (await fetch(`${url}/api/state`)).json()).revision, state.revision);
console.log(JSON.stringify({ result: 'PASS', checks: ['参加者登録', '総当たり', '2戦記録', 'SSE初期状態・更新', '同時更新409', '別サイト書込403', '本戦進出・決勝', 'CSV式注入対策', 'JSON履歴出力'], revision: state.revision, matches: state.matches.length, finalId: final.id }, null, 2));
