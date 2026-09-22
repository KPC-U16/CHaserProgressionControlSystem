import type { ControlState } from '@chros/shared';
import { groupNames } from '@chros/scoring';
export function boardPages(state: ControlState) {
  const cards = groupNames(state).flatMap(group => Array.from({ length: Math.ceil(state.players.filter(p => p.group === group).length / 6) }, (_, page) => ({ group, offset: page * 6 })));
  const standingsPages = Array.from({ length: Math.ceil(cards.length / 2) }, (_, i) => cards.slice(i * 2, i * 2 + 2));
  const finals = state.matches.filter(m => m.stage === 'finals');
  const bracketPages = finals.filter(m => m.round === 1).length <= 4 ? [undefined] : [...new Set(finals.map(m => m.round))].flatMap(round => Array.from({ length: Math.ceil(finals.filter(m => m.round === round).length / 4) }, (_, i) => ({ round, offset: i * 4 })));
  const count = Math.max(1, state.scene === 'standings' ? standingsPages.length : state.scene === 'bracket' ? bracketPages.length : 1);
  const index = Math.min(state.boardPage, count - 1);
  return { count, index, cards: standingsPages[index] ?? [], bracket: bracketPages[index] };
}
