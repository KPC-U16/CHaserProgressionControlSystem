import type { ControlState } from '@chros/shared';
import { groupNames } from '@chros/scoring';

export const STANDINGS_ROWS_PER_CARD = 6;
const STANDINGS_CARDS_PER_PAGE = 2;
export const BRACKET_MATCHES_PER_PAGE = 4;

function createStandingsPages(state: ControlState) {
  const cards = groupNames(state).flatMap((group) => {
    const playerCount = state.players.filter((player) => player.group === group).length;
    const cardCount = Math.ceil(playerCount / STANDINGS_ROWS_PER_CARD);
    return Array.from({ length: cardCount }, (_, index) => ({
      group,
      offset: index * STANDINGS_ROWS_PER_CARD,
    }));
  });

  const pageCount = Math.ceil(cards.length / STANDINGS_CARDS_PER_PAGE);
  return Array.from({ length: pageCount }, (_, index) => {
    const offset = index * STANDINGS_CARDS_PER_PAGE;
    return cards.slice(offset, offset + STANDINGS_CARDS_PER_PAGE);
  });
}

function createBracketPages(state: ControlState) {
  const finals = state.matches.filter((match) => match.stage === 'finals');
  const firstRound = finals.filter((match) => match.round === 1);
  if (firstRound.length <= BRACKET_MATCHES_PER_PAGE) return [undefined];

  const rounds = new Set(finals.map((match) => match.round));
  return [...rounds].flatMap((round) => {
    const matchCount = finals.filter((match) => match.round === round).length;
    const pageCount = Math.ceil(matchCount / BRACKET_MATCHES_PER_PAGE);
    return Array.from({ length: pageCount }, (_, index) => ({
      round,
      offset: index * BRACKET_MATCHES_PER_PAGE,
    }));
  });
}

export function boardPages(state: ControlState) {
  const standingsPages = createStandingsPages(state);
  const bracketPages = createBracketPages(state);
  let pageCount = 1;
  if (state.scene === 'standings') pageCount = standingsPages.length;
  if (state.scene === 'bracket') pageCount = bracketPages.length;

  const count = Math.max(1, pageCount);
  const index = Math.min(state.boardPage, count - 1);
  return { count, index, cards: standingsPages[index] ?? [], bracket: bracketPages[index] };
}
