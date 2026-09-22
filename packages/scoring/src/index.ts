import type { OutputSlot, SlotValues } from '@chros/shared';

/**
 * スコア計算エンジン（§5）は設計継続中（トラックB）。
 * ここは §10.1 が許す「固定のダミー実装」であり、ノードグラフ評価器が乗った時点で
 * 差し替わる。Viewer はスロット定義に従って描画するため、差し替え時の画面側の改修は不要。
 *
 * 副作用と I/O を持たない。DB・HTTP・React に依存しない（§2）。
 */

/** ダミーのスロット定義。スロットは `score` 1つだけ。 */
export const DUMMY_SLOTS: OutputSlot[] = [{ name: 'score', label: 'スコア' }];

export type HalfInput = {
  /** 素点。CHaser の取得アイテム数などをそのまま入れる */
  rawScore: number;
};

/** ハーフ1つ分のスロット値を求める。現状は素点をそのまま `score` に置くだけ。 */
export function evaluateHalf(input: HalfInput): SlotValues {
  return { score: input.rawScore };
}

/** 対戦全体（両ハーフ）のスロット値を合算する。 */
export function aggregateMatch(halves: SlotValues[]): SlotValues {
  const result: SlotValues = {};
  for (const half of halves) {
    for (const [name, value] of Object.entries(half)) {
      result[name] = (result[name] ?? 0) + value;
    }
  }
  return result;
}

export * from './match';
