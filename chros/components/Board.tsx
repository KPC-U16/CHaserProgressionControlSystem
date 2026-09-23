import { phaseLabels, type ControlState } from '@chros/shared';
import { MatchScene } from './board/MatchScene';
import { BracketScene, CeremonyScene, LogoScene, StandingsScene } from './board/OverviewScenes';
export { Bracket } from './board/Bracket';
export { StandingsTable } from './board/StandingsTable';

function BoardContent({ state }: { state: ControlState }) {
  switch (state.scene) {
    case 'match':
    case 'result': {
      const match = state.matches.find((candidate) => candidate.id === state.currentMatchId);
      if (match) return <MatchScene state={state} match={match} />;
      return (
        <div className="board-empty">
          <h2>次の対戦を準備しています</h2>
          <p>組み合わせが決まり次第、ご案内します</p>
        </div>
      );
    }
    case 'standings':
      return <StandingsScene state={state} />;
    case 'bracket':
      return <BracketScene state={state} />;
    case 'logo':
      return <LogoScene state={state} />;
    default:
      return <CeremonyScene state={state} />;
  }
}

export default function Board({ state }: { state: ControlState }) {
  return (
    <div className={`board scene-${state.scene}`}>
      <div className="board-header">
        <div className="board-brand">
          CHroS<span>CHASER TOURNAMENT</span>
        </div>
        <span className="board-title">{state.title}</span>
        <span className="board-phase">
          <i />
          {phaseLabels[state.phase]}
        </span>
      </div>
      <div className="board-main">
        <BoardContent state={state} />
      </div>
      <div className="board-footer">
        <span>
          {state.demo
            ? 'SAMPLE TOURNAMENT · 架空の参加者によるデモ'
            : 'CHASER PROGRESSION CONTROL SYSTEM'}
        </span>
        <span>スコアは各戦の終了後に更新</span>
        <b>CHroS / {String(state.revision).padStart(3, '0')}</b>
      </div>
    </div>
  );
}
