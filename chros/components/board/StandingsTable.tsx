import { standings } from '@chros/scoring';
import { type ControlState } from '@chros/shared';

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
  const allRows = standings(state, group);
  const rows = allRows.slice(offset, limit ? offset + limit : undefined);
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
            <th>{state.profile === 'asahikawa' ? '換算スコア' : 'スコア'}</th>
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
