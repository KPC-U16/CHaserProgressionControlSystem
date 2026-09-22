import type { Command, ControlState, Game, Match } from '@chros/shared';
import { phaseLabels, reasonLabels, sceneLabels } from '@chros/shared';
import { evaluateMatch, groupNames, playerName, standings } from '@chros/scoring';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function emptyMatch(
  label: string,
  a: string | null,
  b: string | null,
  group: string,
): Match {
  return {
    id: uid(),
    label,
    stage: 'qualifying',
    group,
    a,
    b,
    sources: [null, null],
    round: 0,
    firstCool: null,
    started: false,
    bye: false,
    games: [],
    attempt: 1,
    previousAttempts: [],
  };
}
function qualifyingMatches(state: ControlState) {
  return groupNames(state).flatMap((group) => {
    const players = state.players.filter((p) => p.group === group),
      result: Match[] = [];
    for (let a = 0; a < players.length; a++)
      for (let b = a + 1; b < players.length; b++) {
        result.push(
          emptyMatch(
            `${group}-${String(result.length + 1).padStart(2, '0')}`,
            players[a]!.id,
            players[b]!.id,
            group,
          ),
        );
      }
    return result;
  });
}
export function createInitialState(demo = true): ControlState {
  const state: ControlState = {
    schemaVersion: 1,
    tournamentId: uid(),
    revision: 0,
    updatedAt: now(),
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
    state.matches = qualifyingMatches(state);
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

export function suggestedQualifiers(state: ControlState) {
  const groups = groupNames(state).map((group) =>
    standings(state, group).slice(0, state.advancePerGroup),
  );
  // 同順位を各組から順に配置。2組×2名なら A1, B1, A2, B2 → シード配置で A1-B2, B1-A2。
  return Array.from({ length: state.advancePerGroup }, (_, rank) =>
    groups.map((rows) => rows[rank]?.player.id).filter((id): id is string => !!id),
  ).flat();
}

function synchronizeFinals(state: ControlState) {
  for (const match of state.matches
    .filter((m) => m.stage === 'finals')
    .sort((a, b) => a.round - b.round)) {
    match.sources.forEach((sourceId, i) => {
      if (!sourceId) return;
      const source = state.matches.find((m) => m.id === sourceId)!;
      const winner = evaluateMatch(source, state.profile).winnerId;
      const side = i === 0 ? 'a' : 'b';
      assert(
        !match.started || match[side] === winner,
        '次の試合が開始済みです。進出者が変わる修正はできません。',
      );
      match[side] = winner;
    });
  }
}

export function applyCommand(previous: ControlState, command: Command): ControlState {
  let state = structuredClone(previous);
  let detail = '';
  const findMatch = (id: string) => {
    const match = state.matches.find((m) => m.id === id);
    assert(match, '試合が見つかりません。');
    return match;
  };
  const finalsExist = () => state.matches.some((m) => m.stage === 'finals');
  const editableMatch = (match: Match) => {
    assert(
      !(match.stage === 'qualifying' && finalsExist()),
      '本戦の組み合わせ確定後は予選結果を変更できません。',
    );
    assert(!match.bye, '不戦進出の枠には得点を入力できません。');
  };
  switch (command.type) {
    case 'show':
      state.scene = command.scene;
      state.phase = command.phase;
      state.cueId = null;
      state.boardPage = 0;
      detail = `${phaseLabels[state.phase]} / ${sceneLabels[state.scene]}`;
      break;
    case 'board-page':
      state.boardPage = command.page;
      detail = `掲示ページ: ${command.page + 1}`;
      break;
    case 'select-match': {
      const match = findMatch(command.matchId);
      state.currentMatchId = match.id;
      detail = `掲示対象: ${match.label}`;
      break;
    }
    case 'start-match': {
      const match = findMatch(command.matchId);
      editableMatch(match);
      assert(match.a && match.b, '両方の対戦者が確定してから開始してください。');
      assert(!match.started, 'この試合は開始済みです。');
      assert([match.a, match.b].includes(command.firstCool), '先攻は対戦者から選んでください。');
      match.firstCool = command.firstCool;
      match.started = true;
      detail = `${match.label}: じゃんけん後の第1戦先攻 ${playerName(state, command.firstCool)}`;
      break;
    }
    case 'save-game': {
      const match = findMatch(command.matchId);
      editableMatch(match);
      assert(match.started && match.firstCool, '先攻を登録して試合を開始してください。');
      assert(
        command.game.number === 1 || match.games.some((g) => g.number === 1),
        '第1戦を先に記録してください。',
      );
      assert(
        command.game.reason === 'points'
          ? command.game.specialWinner === null
          : command.game.specialWinner !== null,
        '勝因と特殊ポイントの勝者が一致していません。',
      );
      const old = match.games.find((g) => g.number === command.game.number);
      assert(
        !old || command.correction.length > 0,
        '記録済みの結果を直す場合は訂正理由が必要です。',
      );
      match.games = [
        ...match.games.filter((g) => g.number !== command.game.number),
        command.game,
      ].sort((a, b) => a.number - b.number);
      detail = `${match.label} 第${command.game.number}戦: ${command.game.scoreA} - ${command.game.scoreB} / ${reasonLabels[command.game.reason]} / 特殊勝者 ${command.game.specialWinner ? playerName(state, match[command.game.specialWinner]) : 'なし'} / 残り ${command.game.remainingTurns}ターン`;
      if (old) detail += ` / 訂正理由: ${command.correction} / 変更前: ${JSON.stringify(old)}`;
      synchronizeFinals(state);
      break;
    }
    case 'replay': {
      const match = findMatch(command.matchId);
      editableMatch(match);
      assert(match.started, '未開始の試合は仕切り直せません。');
      match.previousAttempts.push({
        games: structuredClone(match.games),
        firstCool: match.firstCool,
        at: now(),
        reason: command.reason,
      });
      match.games = [];
      match.firstCool = null;
      match.started = false;
      match.attempt++;
      detail = `${match.label}: 両戦を無効にして再試合 / ${command.reason}`;
      synchronizeFinals(state);
      break;
    }
    case 'save-player': {
      const old = state.players.find((p) => p.id === command.player.id);
      assert(
        !state.matches.length || (old && old.group === command.player.group),
        '組み合わせ作成後の追加・グループ変更はできません。',
      );
      assert(
        !state.players.some((p) => p.id !== command.player.id && p.name === command.player.name),
        '同じ表示名があります。区別できる名前にしてください。',
      );
      assert(old || state.players.length < 128, '参加者は128名まで登録できます。');
      state.players = old
        ? state.players.map((p) => (p.id === old.id ? command.player : p))
        : [...state.players, command.player];
      detail = `${old ? '参加者更新' : '参加者追加'}: ${command.player.name} / ${command.player.group}組`;
      break;
    }
    case 'remove-player':
      assert(!state.matches.length, '組み合わせ作成後の参加者削除はできません。');
      detail = `参加者削除: ${playerName(state, command.playerId)}`;
      state.players = state.players.filter((p) => p.id !== command.playerId);
      break;
    case 'generate-qualifying':
      assert(!state.matches.length, '組み合わせはすでに作成されています。');
      assert(state.players.length >= 2, '参加者を2名以上登録してください。');
      assert(
        groupNames(state).every((g) => state.players.filter((p) => p.group === g).length >= 2),
        '各グループに2名以上登録してください。',
      );
      state.matches = qualifyingMatches(state);
      state.currentMatchId = state.matches[0]!.id;
      detail = `${groupNames(state).length}組 / 総当たり ${state.matches.length}試合を作成`;
      break;
    case 'generate-finals': {
      assert(!finalsExist(), '本戦はすでに作成されています。');
      const qualifying = state.matches.filter((m) => m.stage === 'qualifying');
      assert(
        qualifying.length && qualifying.every((m) => evaluateMatch(m, state.profile).winnerId),
        'すべての予選試合を確定してから本戦を作成してください。',
      );
      const suggested = suggestedQualifiers(state);
      assert(
        command.qualifiers.length === suggested.length &&
          new Set(command.qualifiers).size === command.qualifiers.length,
        '各組の進出人数と重複を確認してください。',
      );
      for (const group of groupNames(state)) {
        const rows = standings(state, group);
        const count = Math.min(state.advancePerGroup, rows.length);
        const selected = rows.filter((r) => command.qualifiers.includes(r.player.id));
        assert(selected.length === count, `${group}組の進出人数が違います。`);
        const cutoff = rows[count - 1]!.rank;
        assert(
          selected.every((r) => r.rank <= cutoff) &&
            rows
              .filter((r) => r.rank < cutoff)
              .every((r) => command.qualifiers.includes(r.player.id)),
          '同順位以外の順位は変更できません。',
        );
        if (rows.some((r) => r.tied && r.rank <= cutoff))
          assert(
            command.justification.length,
            '同順位のシード順・進出者を選んだ理由を記録してください。',
          );
      }
      assert(
        command.qualifiers.every((id) => state.players.some((p) => p.id === id)),
        '未登録の進出者です。',
      );
      if (command.qualifiers.some((id, i) => id !== suggested[i]))
        assert(
          command.justification.length,
          '候補から進出者・シード順を変更した理由を記録してください。',
        );
      let size = 2;
      while (size < command.qualifiers.length) size *= 2;
      let seeds = [1, 2];
      while (seeds.length < size) seeds = seeds.flatMap((n) => [n, seeds.length * 2 + 1 - n]);
      let prior: Match[] = [];
      const totalRounds = Math.log2(size);
      for (let round = 1; round <= totalRounds; round++) {
        const current: Match[] = [];
        for (let i = 0; i < size / 2 ** round; i++) {
          const label =
            round === totalRounds
              ? '決勝'
              : round === totalRounds - 1
                ? `準決勝 ${i + 1}`
                : `本戦 R${round}-${i + 1}`;
          const a = round === 1 ? (command.qualifiers[seeds[i * 2]! - 1] ?? null) : null;
          const b = round === 1 ? (command.qualifiers[seeds[i * 2 + 1]! - 1] ?? null) : null;
          const match = emptyMatch(label, a, b, '');
          match.stage = 'finals';
          match.round = round;
          if (round === 1) match.bye = !a || !b;
          else match.sources = [prior[i * 2]!.id, prior[i * 2 + 1]!.id];
          current.push(match);
          state.matches.push(match);
        }
        prior = current;
      }
      synchronizeFinals(state);
      detail = `本戦作成 / シード順: ${command.qualifiers.map((id) => playerName(state, id)).join(' → ')} / 裁定: ${command.justification || '規定順位による'}`;
      break;
    }
    case 'settings':
      assert(
        command.profile === state.profile || !state.matches.some((m) => m.started),
        '試合開始後は計算方式を変更できません。',
      );
      assert(
        command.advancePerGroup === state.advancePerGroup || !finalsExist(),
        '本戦確定後は進出人数を変更できません。',
      );
      Object.assign(state, {
        title: command.title,
        subtitle: command.subtitle,
        profile: command.profile,
        advancePerGroup: command.advancePerGroup,
      });
      detail = `大会設定: ${command.title} / ${command.profile} / 各組上位${command.advancePerGroup}名`;
      break;
    case 'logo':
      state.logo = command.data;
      detail = command.data ? '幕間ロゴを更新' : '幕間ロゴを解除';
      break;
    case 'save-cues':
      assert(
        new Set(command.cues.map((c) => c.id)).size === command.cues.length,
        '表示順のIDが重複しています。',
      );
      state.cues = command.cues;
      if (!state.cues.some((c) => c.id === state.cueId)) state.cueId = null;
      detail = `表示順を更新: ${state.cues.map((c) => c.label).join(' → ')}`;
      break;
    case 'play-cue': {
      const cue = state.cues.find((c) => c.id === command.cueId);
      assert(cue, '表示順が見つかりません。');
      state.cueId = cue.id;
      state.phase = cue.phase;
      state.scene = cue.scene;
      state.boardPage = 0;
      detail = `表示順: ${cue.label}`;
      break;
    }
    case 'reset':
      state = createInitialState(command.demo);
      detail = command.demo ? 'サンプル大会を読み込み' : '空の大会を作成';
      break;
  }
  state.revision = previous.revision + 1;
  state.updatedAt = now();
  state.audit.push({ id: uid(), at: state.updatedAt, action: command.type, detail });
  return state;
}
