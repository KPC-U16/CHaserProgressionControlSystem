import type { Command, ControlState } from '@chros/shared';
import { phaseLabels, sceneLabels } from '@chros/shared';
import { createInitialState } from './tournament/initial-state';
import { assertAllowed, findMatch } from './tournament/matches';
import { replayMatch, saveGame, startMatch } from './tournament/match-commands';
import { removePlayer, savePlayer } from './tournament/players';
import { generateQualifying } from './tournament/qualifying';
import { generateFinals } from './tournament/finals';

export { createInitialState } from './tournament/initial-state';
export { createMatch as emptyMatch } from './tournament/matches';
export { suggestedQualifiers } from './tournament/finals';

function updateSettings(state: ControlState, command: Extract<Command, { type: 'settings' }>) {
  const matchesStarted = state.matches.some((match) => match.started);
  const finalsExist = state.matches.some((match) => match.stage === 'finals');
  assertAllowed(
    command.profile === state.profile || !matchesStarted,
    '試合開始後は計算方式を変更できません。',
  );
  assertAllowed(
    command.advancePerGroup === state.advancePerGroup || !finalsExist,
    '本戦確定後は進出人数を変更できません。',
  );

  state.title = command.title;
  state.subtitle = command.subtitle;
  state.profile = command.profile;
  state.advancePerGroup = command.advancePerGroup;
  return `大会設定: ${command.title} / ${command.profile} / 各組上位${command.advancePerGroup}名`;
}

function applyStateChange(state: ControlState, command: Command): string {
  switch (command.type) {
    case 'show':
      state.scene = command.scene;
      state.phase = command.phase;
      state.cueId = null;
      state.boardPage = 0;
      return `${phaseLabels[state.phase]} / ${sceneLabels[state.scene]}`;

    case 'board-page':
      state.boardPage = command.page;
      return `掲示ページ: ${command.page + 1}`;

    case 'select-match': {
      const match = findMatch(state, command.matchId);
      state.currentMatchId = match.id;
      return `掲示対象: ${match.label}`;
    }

    case 'start-match':
      return startMatch(state, command);
    case 'save-game':
      return saveGame(state, command);
    case 'replay':
      return replayMatch(state, command);
    case 'save-player':
      return savePlayer(state, command.player);
    case 'remove-player':
      return removePlayer(state, command.playerId);
    case 'generate-qualifying':
      return generateQualifying(state);
    case 'generate-finals':
      return generateFinals(state, command);
    case 'settings':
      return updateSettings(state, command);

    case 'logo':
      state.logo = command.data;
      return command.data ? '幕間ロゴを更新' : '幕間ロゴを解除';

    case 'save-cues': {
      const cueIds = new Set(command.cues.map((cue) => cue.id));
      assertAllowed(cueIds.size === command.cues.length, '表示順のIDが重複しています。');
      state.cues = command.cues;
      if (!state.cues.some((cue) => cue.id === state.cueId)) state.cueId = null;
      return `表示順を更新: ${state.cues.map((cue) => cue.label).join(' → ')}`;
    }

    case 'play-cue': {
      const cue = state.cues.find((candidate) => candidate.id === command.cueId);
      assertAllowed(cue, '表示順が見つかりません。');
      state.cueId = cue.id;
      state.phase = cue.phase;
      state.scene = cue.scene;
      state.boardPage = 0;
      return `表示順: ${cue.label}`;
    }

    case 'reset':
      return command.demo ? 'サンプル大会を読み込み' : '空の大会を作成';
  }
}

export function applyCommand(previous: ControlState, command: Command): ControlState {
  const state =
    command.type === 'reset' ? createInitialState(command.demo) : structuredClone(previous);
  const detail = applyStateChange(state, command);

  state.revision = previous.revision + 1;
  state.updatedAt = new Date().toISOString();
  state.audit.push({ id: crypto.randomUUID(), at: state.updatedAt, action: command.type, detail });
  return state;
}
