import type { ControlState, Match } from '@chros/shared';

export function assertAllowed(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function createMatch(
  label: string,
  a: string | null,
  b: string | null,
  group: string,
): Match {
  return {
    id: crypto.randomUUID(),
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

export function findMatch(state: ControlState, matchId: string): Match {
  const match = state.matches.find((candidate) => candidate.id === matchId);
  assertAllowed(match, '試合が見つかりません。');
  return match;
}

export function assertEditableMatch(state: ControlState, match: Match) {
  const finalsExist = state.matches.some((candidate) => candidate.stage === 'finals');
  const qualifyingIsLocked = match.stage === 'qualifying' && finalsExist;
  assertAllowed(!qualifyingIsLocked, '本戦の組み合わせ確定後は予選結果を変更できません。');
  assertAllowed(!match.bye, '不戦進出の枠には得点を入力できません。');
}
