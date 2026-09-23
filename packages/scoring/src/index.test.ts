import { describe, expect, it } from 'vitest';
import {
  commandSchema,
  stateSchema,
  type ControlState,
  type Game,
  type Match,
} from '@chros/shared';
import { evaluateGame, evaluateMatch, standings } from './index';
import {
  applyCommand,
  createInitialState,
  emptyMatch,
  suggestedQualifiers,
} from '../../../chros/lib/tournament';

const points = (scoreA: number, scoreB: number, number: 1 | 2 = 1): Game => ({
  number,
  scoreA,
  scoreB,
  reason: 'points',
  specialWinner: null,
  remainingTurns: 0,
});
const special = (reason: Game['reason'], winner: 'a' | 'b' = 'a', number: 1 | 2 = 1): Game => ({
  ...points(2, 90, number),
  reason,
  specialWinner: winner,
  remainingTurns: 37,
});
const matchWith = (...games: Game[]): Match => ({
  ...emptyMatch('test', 'a', 'b', 'A'),
  started: true,
  firstCool: 'a',
  games,
});

describe('対人戦の判定', () => {
  it('1戦目で勝者を確定せず、2戦の合計で判定する', () => {
    expect(evaluateMatch(matchWith(points(100, 0)), 'kushiro').winnerId).toBeNull();
    const result = evaluateMatch(matchWith(points(10, 20), points(50, 10, 2)), 'kushiro');
    expect(result.winnerId).toBe('a');
    expect(result.a.points).toBe(60);
    expect(result.b.points).toBe(30);
  });
  it.each(['put', 'surround', 'disconnect', 'illegal-move', 'self-surround'] as const)(
    '%s は同じ1特殊Pとして扱い、スコアより優先する',
    (reason) => {
      const result = evaluateMatch(matchWith(special(reason), points(1, 100, 2)), 'kushiro');
      expect(result.a.special).toBe(1);
      expect(result.winnerId).toBe('a');
      expect(result.a.raw).toBe(3);
      expect(result.b.raw).toBe(190);
    },
  );
  it('双方1特殊Pならスコアで決め、完全同値なら再試合にする', () => {
    const match = matchWith(special('put'), special('disconnect', 'b', 2));
    expect(evaluateMatch(match, 'kushiro').winnerId).toBe('b');
    match.games[1]!.scoreA = 90;
    match.games[1]!.scoreB = 2;
    expect(evaluateMatch(match, 'kushiro')).toMatchObject({
      winnerId: null,
      tied: true,
      status: 'replay',
    });
  });
  it('スコアによる同点戦に特殊Pやゲーム勝数を付けない', () => {
    expect(evaluateGame(points(15, 15), 'kushiro')).toMatchObject({
      winner: null,
      a: { special: 0, wins: 0 },
      b: { special: 0, wins: 0 },
    });
  });
  it('旭川ではゲーム勝数、次に換算スコアで決める', () => {
    const match = matchWith(special('put'), { ...points(1, 0, 2) });
    expect(evaluateMatch(match, 'asahikawa')).toMatchObject({
      winnerId: 'a',
      a: { wins: 2 },
      b: { points: 0 },
    });
    expect(evaluateMatch(matchWith(points(10, 9), points(0, 30, 2)), 'asahikawa').winnerId).toBe(
      'b',
    );
  });
  it.each(['put', 'surround'] as const)('旭川の%s敗者は0点、素点は保持する', (reason) => {
    expect(evaluateGame(special(reason), 'asahikawa').b).toMatchObject({ raw: 90, points: 0 });
  });
  it.each(['disconnect', 'illegal-move', 'self-surround'] as const)(
    '旭川の%s敗者は残ターン分の負点にする',
    (reason) => {
      expect(evaluateGame(special(reason), 'asahikawa').b).toMatchObject({ raw: 90, points: -37 });
    },
  );
  it('参加者を左右反転しても勝者とスコアの意味が変わらない', () => {
    for (let i = 0; i < 30; i++) {
      const original = matchWith(points(i, 30 - i), {
        ...special(i % 2 ? 'put' : 'disconnect', i % 3 ? 'a' : 'b', 2),
        scoreA: 4,
        scoreB: 5,
      });
      const mirrored = {
        ...original,
        a: original.b,
        b: original.a,
        games: original.games.map((g) => ({
          ...g,
          scoreA: g.scoreB,
          scoreB: g.scoreA,
          specialWinner:
            g.specialWinner === 'a'
              ? ('b' as const)
              : g.specialWinner === 'b'
                ? ('a' as const)
                : null,
        })),
      };
      for (const profile of ['kushiro', 'asahikawa'] as const) {
        expect(evaluateMatch(original, profile).winnerId).toBe(
          evaluateMatch(mirrored, profile).winnerId,
        );
        expect(evaluateMatch(original, profile).a).toEqual(evaluateMatch(mirrored, profile).b);
      }
    }
  });
});

function tournament(groups = 2, playersPerGroup = 3) {
  let state = createInitialState(false);
  state.players = Array.from({ length: groups * playersPerGroup }, (_, i) => ({
    id: `p${i}`,
    name: `参加者${i}`,
    affiliation: '',
    group: String(Math.floor(i / playersPerGroup) + 1),
  }));
  return applyCommand(state, { type: 'generate-qualifying' });
}
function completeMatch(state: ControlState, id: string, flip = false) {
  const match = state.matches.find((m) => m.id === id)!;
  if (!match.started)
    state = applyCommand(state, { type: 'start-match', matchId: id, firstCool: match.a! });
  for (const n of [1, 2] as const)
    state = applyCommand(state, {
      type: 'save-game',
      matchId: id,
      game: points(flip ? 1 : 20, flip ? 20 : 1, n),
      correction: 'テスト訂正',
    });
  return state;
}
function completedQualifying(groups = 2) {
  let state = tournament(groups);
  for (const match of state.matches) state = completeMatch(state, match.id);
  return state;
}
function withFinals(groups = 2) {
  const state = completedQualifying(groups);
  return applyCommand(state, {
    type: 'generate-finals',
    qualifiers: suggestedQualifiers(state),
    justification: '',
  });
}

describe('大会進行と入力保護', () => {
  it('サンプルが保存スキーマに適合し、途中の1戦が順位に混ざらない', () => {
    const state = stateSchema.parse(createInitialState());
    expect(state.matches).toHaveLength(12);
    expect(standings(state).reduce((sum, r) => sum + r.played, 0)).toBe(20);
  });
  it('各組で全ペアを1回ずつ作成する', () => {
    const state = tournament(2, 4);
    expect(state.matches).toHaveLength(12);
    expect(new Set(state.matches.map((m) => [m.a, m.b].sort().join('/'))).size).toBe(12);
    expect(
      state.matches.every(
        (m) =>
          state.players.find((p) => p.id === m.a)!.group ===
          state.players.find((p) => p.id === m.b)!.group,
      ),
    ).toBe(true);
  });
  it('先攻の選択と第1戦の記録を省略できない', () => {
    const state = tournament(),
      id = state.matches[0]!.id;
    expect(() =>
      applyCommand(state, { type: 'save-game', matchId: id, game: points(1, 2), correction: '' }),
    ).toThrow('先攻');
    expect(() =>
      applyCommand(state, { type: 'start-match', matchId: id, firstCool: 'outside' }),
    ).toThrow('対戦者');
    const started = applyCommand(state, { type: 'start-match', matchId: id, firstCool: 'p0' });
    expect(() =>
      applyCommand(started, {
        type: 'save-game',
        matchId: id,
        game: points(1, 2, 2),
        correction: '',
      }),
    ).toThrow('第1戦');
  });
  it('特殊勝因の勝者未選択・スコア戦の特殊勝者指定を拒否する', () => {
    let state = tournament();
    const id = state.matches[0]!.id;
    state = applyCommand(state, { type: 'start-match', matchId: id, firstCool: 'p0' });
    expect(() =>
      applyCommand(state, {
        type: 'save-game',
        matchId: id,
        game: { ...special('put'), specialWinner: null },
        correction: '',
      }),
    ).toThrow('一致');
    expect(() =>
      applyCommand(state, {
        type: 'save-game',
        matchId: id,
        game: { ...points(1, 2), specialWinner: 'a' },
        correction: '',
      }),
    ).toThrow('一致');
  });
  it('負の素点・小数・大きすぎる値をAPIスキーマで拒否する', () => {
    for (const scoreA of [-1, 1.2, 1000])
      expect(
        commandSchema.safeParse({
          type: 'save-game',
          matchId: 'm',
          game: { ...points(1, 2), scoreA },
          correction: '',
        }).success,
      ).toBe(false);
  });
  it('訂正理由を必須にし、変更前の値を履歴に残して再集計する', () => {
    let state = tournament();
    const id = state.matches[0]!.id;
    state = completeMatch(state, id);
    expect(() =>
      applyCommand(state, { type: 'save-game', matchId: id, game: points(0, 90), correction: '' }),
    ).toThrow('訂正理由');
    const corrected = applyCommand(state, {
      type: 'save-game',
      matchId: id,
      game: points(0, 90),
      correction: '用紙との照合',
    });
    expect(corrected.audit.at(-1)!.detail).toContain('"scoreA":20');
    expect(standings(corrected).find((r) => r.player.id === 'p1')!.wins).toBe(1);
    expect(state.matches[0]!.games[0]!.scoreA).toBe(20);
  });
  it('再試合は両戦を無効にして履歴を保存し、順位から除く', () => {
    let state = tournament();
    const id = state.matches[0]!.id;
    state = completeMatch(state, id);
    state = applyCommand(state, { type: 'replay', matchId: id, reason: 'サーバー不具合' });
    expect(state.matches[0]).toMatchObject({
      games: [],
      started: false,
      firstCool: null,
      attempt: 2,
    });
    expect(state.matches[0]!.previousAttempts[0]!.games).toHaveLength(2);
    expect(standings(state).every((r) => r.played === 0)).toBe(true);
  });
  it('同点の試合は順位に算入せず、本戦へ進めない', () => {
    let state = tournament(1, 2);
    const id = state.matches[0]!.id;
    state = completeMatch(state, id);
    state = applyCommand(state, {
      type: 'save-game',
      matchId: id,
      game: points(1, 20, 2),
      correction: '同点に訂正',
    });
    expect(standings(state).every((r) => r.played === 0)).toBe(true);
    expect(() =>
      applyCommand(state, { type: 'generate-finals', qualifiers: ['p0', 'p1'], justification: '' }),
    ).toThrow('すべての予選');
  });
  it('本戦作成後の予選修正と試合開始後の計算方式変更を拒否する', () => {
    const state = withFinals();
    expect(() =>
      applyCommand(state, {
        type: 'save-game',
        matchId: state.matches[0]!.id,
        game: points(0, 90),
        correction: '変更',
      }),
    ).toThrow('本戦');
    expect(() =>
      applyCommand(state, {
        type: 'settings',
        title: state.title,
        subtitle: '',
        profile: 'asahikawa',
        advancePerGroup: 2,
      }),
    ).toThrow('計算方式');
  });
  it('2組の上位2名は準決勝で別組と戦い、勝者を決勝に送る', () => {
    let state = withFinals();
    const semi = state.matches.filter((m) => m.stage === 'finals' && m.round === 1);
    expect(semi).toHaveLength(2);
    expect(
      semi.every(
        (m) =>
          state.players.find((p) => p.id === m.a)!.group !==
          state.players.find((p) => p.id === m.b)!.group,
      ),
    ).toBe(true);
    for (const match of semi) state = completeMatch(state, match.id);
    const final = state.matches.find((m) => m.round === 2)!;
    expect([final.a, final.b]).toEqual(semi.map((m) => m.a));
  });
  it('6名の本戦は不戦進出2枠を作り、自動で次戦へ進める', () => {
    const state = withFinals(3);
    const byes = state.matches.filter((m) => m.bye);
    expect(byes).toHaveLength(2);
    for (const bye of byes)
      expect(
        state.matches.find((m) => m.sources.includes(bye.id))![
          state.matches.find((m) => m.sources.includes(bye.id))!.sources[0] === bye.id ? 'a' : 'b'
        ],
      ).toBe(evaluateMatch(bye, state.profile).winnerId);
  });
  it('次戦が始まった後に勝者が変わる修正を拒否し、元状態を保つ', () => {
    let state = withFinals();
    const semi = state.matches.filter((m) => m.stage === 'finals' && m.round === 1);
    for (const match of semi) state = completeMatch(state, match.id);
    const final = state.matches.find((m) => m.round === 2)!;
    state = applyCommand(state, { type: 'start-match', matchId: final.id, firstCool: final.a! });
    const before = JSON.stringify(state);
    expect(() =>
      applyCommand(state, {
        type: 'save-game',
        matchId: semi[0]!.id,
        game: points(0, 999),
        correction: '変更',
      }),
    ).toThrow('次の試合');
    expect(JSON.stringify(state)).toBe(before);
  });
  it('同順位の進出裁定には理由が必要で、重複と下位の繰上げを拒否する', () => {
    let state = tournament(1, 3);
    for (const [i, match] of state.matches.entries())
      state = completeMatch(state, match.id, i === 1);
    expect(standings(state).every((r) => r.rank === 1 && r.tied)).toBe(true);
    expect(() =>
      applyCommand(state, { type: 'generate-finals', qualifiers: ['p0', 'p1'], justification: '' }),
    ).toThrow('理由');
    expect(() =>
      applyCommand(state, {
        type: 'generate-finals',
        qualifiers: ['p0', 'p0'],
        justification: '抽選',
      }),
    ).toThrow('重複');
    expect(
      applyCommand(state, {
        type: 'generate-finals',
        qualifiers: ['p1', 'p2'],
        justification: '抽選で決定',
      }).matches.filter((m) => m.stage === 'finals'),
    ).toHaveLength(1);
    const ranked = completedQualifying();
    expect(() =>
      applyCommand(ranked, {
        type: 'generate-finals',
        qualifiers: ['p0', 'p3', 'p2', 'p4'],
        justification: '独断',
      }),
    ).toThrow('同順位以外');
  });
  it('表示順と直接切り替えの状態を保存し、空の大会に安全に切り替える', () => {
    const state = createInitialState();
    const played = applyCommand(state, { type: 'play-cue', cueId: 'closing' });
    expect(played).toMatchObject({
      phase: 'closing',
      scene: 'ceremony',
      cueId: 'closing',
      revision: 1,
    });
    const shown = applyCommand(played, { type: 'show', scene: 'logo', phase: 'break' });
    expect(shown.cueId).toBeNull();
    const reset = applyCommand(shown, { type: 'reset', demo: false, confirmation: 'RESET' });
    expect(reset.tournamentId).not.toBe(shown.tournamentId);
    expect(reset.players).toHaveLength(0);
    expect(reset.revision).toBe(3);
  });
});
