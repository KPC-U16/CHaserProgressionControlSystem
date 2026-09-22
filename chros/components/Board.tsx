import { phaseLabels, reasonLabels, type ControlState } from '@chros/shared';
import { evaluateMatch, groupNames, playerName, standings } from '@chros/scoring';
import { boardPages } from '@/lib/board-pages';

export function StandingsTable({
  state,
  group,
  offset = 0,
  limit,
}: {
  state: ControlState;
  group: string;
  offset?: number;
  limit?: number;
}) {
  const allRows = standings(state, group),
    rows = allRows.slice(offset, limit ? offset + limit : undefined);
  return (
    <div className="standings-group">
      <div className="group-title">
        <span>
          GROUP {group}
          {limit && allRows.length > limit ? ` · ${offset + 1}–${offset + rows.length}` : ''}
        </span>
        <small>上位 {Math.min(allRows.length, state.advancePerGroup)} 名が本戦へ</small>
      </div>
      <table>
        <thead>
          <tr>
            <th>順位</th>
            <th>参加者</th>
            <th>勝–敗</th>
            <th>特殊P</th>
            <th>{state.profile === 'asahikawa' ? '換算得点' : '得点'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.player.id}
              className={row.rank <= state.advancePerGroup ? 'qualifier-row' : ''}
            >
              <td>
                <span className="rank-number">{row.played ? row.rank : '–'}</span>
              </td>
              <td>
                <strong>{row.player.name}</strong>
                <small>{row.player.affiliation}</small>
              </td>
              <td>
                {row.wins}–{row.losses}
              </td>
              <td>{row.special}</td>
              <td className="numeric">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bracket({
  state,
  page,
}: {
  state: ControlState;
  page?: { round: number; offset: number };
}) {
  const allMatches = state.matches.filter((m) => m.stage === 'finals');
  const finalRound = Math.max(...allMatches.map((m) => m.round));
  const matches = page
    ? allMatches.filter((m) => m.round === page.round).slice(page.offset, page.offset + 4)
    : allMatches;
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
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
            {round === finalRound
              ? 'FINAL'
              : round === finalRound - 1
                ? 'SEMI FINAL'
                : `ROUND ${round}`}
            {page ? ` · ${page.offset + 1}–${page.offset + matches.length}` : ''}
          </div>
          <div className="round-matches">
            {matches
              .filter((m) => m.round === round)
              .map((match) => {
                const result = evaluateMatch(match, state.profile);
                return (
                  <div className="bracket-match" key={match.id}>
                    <small>
                      {match.label}
                      {match.bye ? ' · 不戦進出' : ''}
                    </small>
                    {(['a', 'b'] as const).map((side) => (
                      <div
                        key={side}
                        className={
                          result.winnerId && match[side] === result.winnerId ? 'bracket-winner' : ''
                        }
                      >
                        <span>
                          {match[side]
                            ? playerName(state, match[side])
                            : match.bye
                              ? '不戦枠'
                              : '対戦者未定'}
                        </span>
                        <b>
                          {result.winnerId === match[side] && match[side]
                            ? 'WIN'
                            : match.games.length
                              ? result[side].points
                              : '–'}
                        </b>
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Board({ state }: { state: ControlState }) {
  const match = state.matches.find((m) => m.id === state.currentMatchId);
  const result = match ? evaluateMatch(match, state.profile) : null;
  const qualifying = state.matches.filter((m) => m.stage === 'qualifying');
  const completed = qualifying.filter((m) => evaluateMatch(m, state.profile).winnerId).length;
  const pages = boardPages(state);
  const displayMatch = (state.scene === 'match' || state.scene === 'result') && match && result;
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
        {displayMatch ? (
          <>
            <div className="board-kicker">
              <span>
                {match.stage === 'qualifying'
                  ? `QUALIFYING · GROUP ${match.group}`
                  : 'CHAMPIONSHIP'}{' '}
                / {match.label}
                {match.attempt > 1 ? ` · 再試合 ${match.attempt - 1}` : ''}
              </span>
              <span>
                {result.winnerId
                  ? '試合確定'
                  : result.tied
                    ? '同点 · 再試合待ち'
                    : match.games.length
                      ? `第${match.games.length}戦 終了時点`
                      : match.started
                        ? '第1戦 対戦中'
                        : 'まもなく対戦'}
              </span>
            </div>
            {state.scene === 'result' && result.winnerId ? (
              <div className="winner-headline">
                WINNER <span>{playerName(state, result.winnerId)}</span>
                <small>{result.decidedBy}で勝利</small>
              </div>
            ) : (
              <h2 className="board-heading">
                {state.scene === 'result'
                  ? '結果の確定をお待ちください'
                  : 'その一手が、未来を変える。'}
              </h2>
            )}
            <div className="versus-grid">
              {(['a', 'b'] as const).map((side, i) => {
                const player = state.players.find((p) => p.id === match[side]);
                return (
                  <div
                    className={`competitor competitor-${side} ${result.winnerId === match[side] ? 'is-winner' : ''}`}
                    key={side}
                  >
                    <div className="competitor-label">
                      PLAYER {i + 1}
                      <span>{result.winnerId === match[side] ? 'WINNER ↗' : ''}</span>
                    </div>
                    <h3>{player?.name ?? '対戦者未定'}</h3>
                    <p>{player?.affiliation || 'CHaser challenger'}</p>
                    <div className="competitor-score">
                      <strong>{match.games.length ? result[side].points : '–'}</strong>
                      <div>
                        <span>{state.profile === 'asahikawa' ? '換算得点' : '合計得点'}</span>
                        <b>
                          {state.profile === 'kushiro'
                            ? `特殊P ${result[side].special}`
                            : `${result[side].wins} ゲーム勝利`}
                        </b>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="versus-mark">VS</div>
            </div>
            <div className="board-games">
              {([1, 2] as const).map((number) => {
                const game = match.games.find((g) => g.number === number);
                const cool = !match.firstCool
                  ? null
                  : number === 1
                    ? match.firstCool
                    : match.firstCool === match.a
                      ? match.b
                      : match.a;
                return (
                  <div key={number}>
                    <b>GAME 0{number}</b>
                    <span>{game ? `${game.scoreA} — ${game.scoreB}` : '未記録'}</span>
                    <span>
                      {game
                        ? reasonLabels[game.reason]
                        : cool
                          ? `先攻 ${playerName(state, cool)}`
                          : '先攻・後攻はじゃんけんで決定'}
                    </span>
                    {game?.specialWinner && (
                      <em>{playerName(state, match[game.specialWinner])} +1P</em>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : state.scene === 'standings' ? (
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
                  limit={6}
                />
              ))}
            </div>
            <p className="board-note">確定した試合のみ集計 · 同順位の進出は主催者の裁定で確定</p>
          </>
        ) : state.scene === 'bracket' ? (
          <>
            <div className="board-kicker">
              CHAMPIONSHIP BRACKET
              <span>
                本戦トーナメント · PAGE {pages.index + 1}/{pages.count}
              </span>
            </div>
            <Bracket state={state} page={pages.bracket} />
          </>
        ) : state.scene === 'logo' ? (
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
        ) : state.scene === 'match' || state.scene === 'result' ? (
          <div className="board-empty">
            <h2>次の対戦を準備しています</h2>
            <p>組み合わせが決まり次第、ご案内します</p>
          </div>
        ) : (
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
        )}
      </div>
      <div className="board-footer">
        <span>
          {state.demo
            ? 'SAMPLE TOURNAMENT · 架空の参加者によるデモ'
            : 'CHASER PROGRESSION CONTROL SYSTEM'}
        </span>
        <span>得点は各戦の終了後に更新</span>
        <b>CHroS / {String(state.revision).padStart(3, '0')}</b>
      </div>
    </div>
  );
}
