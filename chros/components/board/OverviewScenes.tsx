import { boardPages, STANDINGS_ROWS_PER_CARD } from '@/lib/board-pages';
import { evaluateMatch } from '@chros/scoring';
import { phaseLabels, type ControlState } from '@chros/shared';

import { Bracket } from './Bracket';
import { StandingsTable } from './StandingsTable';

export function StandingsScene({ state }: { state: ControlState }) {
  const qualifying = state.matches.filter((match) => match.stage === 'qualifying');
  const completed = qualifying.filter(
    (match) => evaluateMatch(match, state.profile).winnerId,
  ).length;
  const pages = boardPages(state);
  return (
    <>
      <div className="board-kicker">
        QUALIFYING STANDINGS
        <span>
          {completed} / {qualifying.length} 試合確定 · PAGE {pages.index + 1}/{pages.count}
        </span>
      </div>
      <h2 className="board-heading">予選の、その先へ。</h2>
      <div className="board-standings">
        {pages.cards.map((card) => (
          <StandingsTable
            key={`${card.group}-${card.offset}`}
            state={state}
            group={card.group}
            offset={card.offset}
            limit={STANDINGS_ROWS_PER_CARD}
          />
        ))}
      </div>
      <p className="board-note">確定した試合のみ集計 · 同順位の進出は主催者の裁定で確定</p>
    </>
  );
}

export function BracketScene({ state }: { state: ControlState }) {
  const pages = boardPages(state);
  return (
    <>
      <div className="board-kicker">
        CHAMPIONSHIP BRACKET
        <span>
          本戦トーナメント · PAGE {pages.index + 1}/{pages.count}
        </span>
      </div>
      <Bracket state={state} page={pages.bracket} />
    </>
  );
}

export function LogoScene({ state }: { state: ControlState }) {
  return (
    <div className="ceremony">
      <span className="ceremony-eyebrow">{phaseLabels[state.phase]} / INTERMISSION</span>
      {state.logo ? (
        <img className="intermission-logo" src={state.logo} alt="大会ロゴ" />
      ) : (
        <div className="ceremony-logo">
          CH<span>ro</span>S<span className="logo-period">.</span>
        </div>
      )}
      <h2>次の挑戦まで、ひと息。</h2>
      <p>{state.title}</p>
    </div>
  );
}

export function CeremonyScene({ state }: { state: ControlState }) {
  return (
    <div className="ceremony">
      <span className="ceremony-eyebrow">{state.subtitle || 'U-16 PROGRAMMING CONTEST'}</span>
      <div className="ceremony-logo">
        CH<span>ro</span>S<span className="logo-period">.</span>
      </div>
      <h2>{phaseLabels[state.phase]}</h2>
      <p>
        {state.phase === 'closing'
          ? 'すべての挑戦に、ありがとう。'
          : state.phase === 'opening'
            ? 'ここから、次の一手がはじまる。'
            : '自分のコードで、勝利をつかめ。'}
      </p>
    </div>
  );
}
