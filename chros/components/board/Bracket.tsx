import { evaluateMatch, playerName } from '@chros/scoring';
import { BRACKET_MATCHES_PER_PAGE } from '@/lib/board-pages';
import { type ControlState } from '@chros/shared';

function roundTitle(round: number, finalRound: number) {
  if (round === finalRound) return 'FINAL';
  if (round === finalRound - 1) return 'SEMI FINAL';
  return `ROUND ${round}`;
}

export function Bracket({
  state,
  page,
}: {
  state: ControlState;
  page?: { round: number; offset: number };
}) {
  const allMatches = state.matches.filter((match) => match.stage === 'finals');
  const finalRound = Math.max(...allMatches.map((match) => match.round));
  const matches = page
    ? allMatches
        .filter((match) => match.round === page.round)
        .slice(page.offset, page.offset + BRACKET_MATCHES_PER_PAGE)
    : allMatches;
  const rounds = [...new Set(matches.map((match) => match.round))].sort((a, b) => a - b);
  if (!matches.length)
    return (
      <div className="board-empty">
        <span className="large-symbol">↗</span>
        <h2>本戦への道は、ここから。</h2>
        <p>予選終了後に組み合わせを発表します</p>
      </div>
    );
  return (
    <div className={`bracket ${page ? 'bracket-paged' : ''}`}>
      {rounds.map((round) => (
        <div className="bracket-round" key={round}>
          <div className="round-title">
            {roundTitle(round, finalRound)}
            {page ? ` · ${page.offset + 1}–${page.offset + matches.length}` : ''}
          </div>
          <div className="round-matches">
            {matches
              .filter((match) => match.round === round)
              .map((match) => {
                const result = evaluateMatch(match, state.profile);
                return (
                  <div className="bracket-match" key={match.id}>
                    <small>
                      {match.label}
                      {match.bye ? ' · 不戦進出' : ''}
                    </small>
                    {(['a', 'b'] as const).map((side) => {
                      const playerId = match[side];
                      const isWinner = result.winnerId === playerId && !!playerId;
                      const emptySlotLabel = match.bye ? '不戦枠' : '対戦者未定';
                      const pointsLabel = match.games.length ? result[side].points : '–';
                      return (
                        <div key={side} className={isWinner ? 'bracket-winner' : ''}>
                          <span>{playerId ? playerName(state, playerId) : emptySlotLabel}</span>
                          <b>{isWinner ? 'WIN' : pointsLabel}</b>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
