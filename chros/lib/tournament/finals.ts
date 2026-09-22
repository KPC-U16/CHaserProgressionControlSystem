import type { Command, ControlState, Match } from '@chros/shared';
import { evaluateMatch, groupNames, playerName, standings } from '@chros/scoring';
import { assertAllowed, createMatch } from './matches';

type GenerateFinals = Extract<Command, { type: 'generate-finals' }>;

export function suggestedQualifiers(state: ControlState) {
  const groups = groupNames(state).map((group) =>
    standings(state, group).slice(0, state.advancePerGroup),
  );
  // A1, B1, A2, B2 の順に渡すと、シード配置が A1-B2 / B1-A2 になる。
  return Array.from({ length: state.advancePerGroup }, (_, rank) =>
    groups.map((rows) => rows[rank]?.player.id).filter((id): id is string => !!id),
  ).flat();
}

function validateGroupQualifiers(state: ControlState, command: GenerateFinals, group: string) {
  const rows = standings(state, group);
  const qualifierCount = Math.min(state.advancePerGroup, rows.length);
  const selectedRows = rows.filter((row) => command.qualifiers.includes(row.player.id));
  assertAllowed(selectedRows.length === qualifierCount, `${group}組の進出人数が違います。`);

  const cutoffRank = rows[qualifierCount - 1]!.rank;
  const selectedWithinCutoff = selectedRows.every((row) => row.rank <= cutoffRank);
  const higherRanksIncluded = rows
    .filter((row) => row.rank < cutoffRank)
    .every((row) => command.qualifiers.includes(row.player.id));
  assertAllowed(selectedWithinCutoff && higherRanksIncluded, '同順位以外の順位は変更できません。');

  const hasTiedQualifiers = rows.some((row) => row.tied && row.rank <= cutoffRank);
  if (hasTiedQualifiers) {
    assertAllowed(
      command.justification.length,
      '同順位のシード順・進出者を選んだ理由を記録してください。',
    );
  }
}

function validateQualifiers(state: ControlState, command: GenerateFinals) {
  const finalsExist = state.matches.some((match) => match.stage === 'finals');
  assertAllowed(!finalsExist, '本戦はすでに作成されています。');

  const qualifying = state.matches.filter((match) => match.stage === 'qualifying');
  const qualifyingComplete =
    qualifying.length > 0 &&
    qualifying.every((match) => evaluateMatch(match, state.profile).winnerId);
  assertAllowed(qualifyingComplete, 'すべての予選試合を確定してから本戦を作成してください。');

  const suggested = suggestedQualifiers(state);
  const correctCount = command.qualifiers.length === suggested.length;
  const noDuplicates = new Set(command.qualifiers).size === command.qualifiers.length;
  assertAllowed(correctCount && noDuplicates, '各組の進出人数と重複を確認してください。');

  for (const group of groupNames(state)) {
    validateGroupQualifiers(state, command, group);
  }

  const allRegistered = command.qualifiers.every((id) =>
    state.players.some((player) => player.id === id),
  );
  assertAllowed(allRegistered, '未登録の進出者です。');

  const seedingChanged = command.qualifiers.some((id, index) => id !== suggested[index]);
  if (seedingChanged) {
    assertAllowed(
      command.justification.length,
      '候補から進出者・シード順を変更した理由を記録してください。',
    );
  }
}

function seedOrder(qualifierCount: number) {
  let bracketSize = 2;
  while (bracketSize < qualifierCount) bracketSize *= 2;

  let seeds = [1, 2];
  while (seeds.length < bracketSize) {
    const pairedSeedTotal = seeds.length * 2 + 1;
    seeds = seeds.flatMap((seed) => [seed, pairedSeedTotal - seed]);
  }
  return seeds;
}

function roundLabel(round: number, totalRounds: number, matchNumber: number) {
  if (round === totalRounds) return '決勝';
  if (round === totalRounds - 1) return `準決勝 ${matchNumber}`;
  return `本戦 R${round}-${matchNumber}`;
}

function createFinalsMatches(qualifiers: string[]) {
  const seeds = seedOrder(qualifiers.length);
  const totalRounds = Math.log2(seeds.length);
  const matches: Match[] = [];
  let previousRound: Match[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const currentRound: Match[] = [];
    const matchesInRound = seeds.length / 2 ** round;

    for (let index = 0; index < matchesInRound; index++) {
      const label = roundLabel(round, totalRounds, index + 1);
      const playerA = round === 1 ? (qualifiers[seeds[index * 2]! - 1] ?? null) : null;
      const playerB = round === 1 ? (qualifiers[seeds[index * 2 + 1]! - 1] ?? null) : null;
      const match = createMatch(label, playerA, playerB, '');
      match.stage = 'finals';
      match.round = round;

      if (round === 1) {
        match.bye = !playerA || !playerB;
      } else {
        match.sources = [previousRound[index * 2]!.id, previousRound[index * 2 + 1]!.id];
      }

      currentRound.push(match);
      matches.push(match);
    }
    previousRound = currentRound;
  }

  return matches;
}

export function synchronizeFinals(state: ControlState) {
  const finals = state.matches
    .filter((match) => match.stage === 'finals')
    .sort((first, second) => first.round - second.round);

  for (const match of finals) {
    match.sources.forEach((sourceId, index) => {
      if (!sourceId) return;
      const source = state.matches.find((candidate) => candidate.id === sourceId)!;
      const winnerId = evaluateMatch(source, state.profile).winnerId;
      const side = index === 0 ? 'a' : 'b';
      const changesStartedMatch = match.started && match[side] !== winnerId;
      assertAllowed(
        !changesStartedMatch,
        '次の試合が開始済みです。進出者が変わる修正はできません。',
      );
      match[side] = winnerId;
    });
  }
}

export function generateFinals(state: ControlState, command: GenerateFinals) {
  validateQualifiers(state, command);
  state.matches.push(...createFinalsMatches(command.qualifiers));
  synchronizeFinals(state);

  const seededNames = command.qualifiers.map((id) => playerName(state, id)).join(' → ');
  return `本戦作成 / シード順: ${seededNames} / 裁定: ${command.justification || '規定順位による'}`;
}
