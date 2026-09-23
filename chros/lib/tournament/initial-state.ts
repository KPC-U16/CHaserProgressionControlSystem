import type { ControlState, Game } from '@chros/shared';
import { createQualifyingMatches } from './qualifying';

export function createInitialState(demo = true): ControlState {
  const state: ControlState = {
    schemaVersion: 1,
    tournamentId: crypto.randomUUID(),
    revision: 0,
    updatedAt: new Date().toISOString(),
    demo,
    title: demo ? 'CHaser 釧路大会｜サンプル' : 'CHaser 釧路大会',
    subtitle: 'U-16 PROGRAMMING CONTEST',
    phase: demo ? 'qualifying' : 'opening',
    scene: demo ? 'match' : 'ceremony',
    profile: 'kushiro',
    advancePerGroup: 2,
    ruleVersion: '2026-09-18.1',
    boardPage: 0,
    players: [],
    matches: [],
    currentMatchId: null,
    logo: null,
    cueId: null,
    audit: [],
    cues: [
      { id: 'opening', label: '開会式', scene: 'ceremony', phase: 'opening' },
      { id: 'qualifying', label: '予選・対戦開始', scene: 'match', phase: 'qualifying' },
      { id: 'rank', label: '予選結果の発表', scene: 'standings', phase: 'qualifying' },
      { id: 'break', label: '休憩', scene: 'logo', phase: 'break' },
      { id: 'finals', label: '本戦の組み合わせ', scene: 'bracket', phase: 'finals' },
      { id: 'final-match', label: '本戦・対戦', scene: 'match', phase: 'finals' },
      { id: 'result', label: '結果発表', scene: 'result', phase: 'finals' },
      { id: 'closing', label: '閉会式', scene: 'ceremony', phase: 'closing' },
    ],
  };
  if (demo) {
    state.players = [
      '青葉 はる',
      '北野 そら',
      '白石 りく',
      '港 みなと',
      '星野 あお',
      '大地 れん',
      '若葉 ひなた',
      '高原 ゆう',
    ].map((name, i) => ({
      id: `player-${i + 1}`,
      name,
      affiliation: ['青空中学校', 'みらい中学校', 'つばさ高校', 'プログラミングクラブ'][i % 4]!,
      group: i < 4 ? 'A' : 'B',
    }));
    state.matches = createQualifyingMatches(state);
    state.matches.forEach((match, i) => {
      if (i > 10) return;
      match.firstCool = match.a;
      match.started = true;
      const game = (number: 1 | 2): Game => ({
        number,
        scoreA: 18 + i * 2 + number,
        scoreB: 13 + i + number,
        reason: i === 3 && number === 1 ? 'put' : 'points',
        specialWinner: i === 3 && number === 1 ? 'a' : null,
        remainingTurns: 40,
      });
      match.games = i === 10 ? [game(1)] : [game(1), game(2)];
    });
    state.currentMatchId = state.matches[10]!.id;
    state.cueId = 'qualifying';
  }
  return state;
}
