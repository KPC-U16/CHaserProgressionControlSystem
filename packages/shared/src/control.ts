import { z } from 'zod';

export const phases = ['opening', 'qualifying', 'finals', 'break', 'closing'] as const;
export type Phase = (typeof phases)[number];
export const phaseLabels: Record<Phase, string> = {
  opening: '開会式',
  qualifying: '予選',
  finals: '本戦',
  break: '休憩・幕間',
  closing: '閉会式',
};
export const scenes = ['ceremony', 'match', 'result', 'standings', 'bracket', 'logo'] as const;
export type Scene = (typeof scenes)[number];
export const sceneLabels: Record<Scene, string> = {
  ceremony: '進行案内',
  match: '対戦・スコア',
  result: '試合結果',
  standings: '予選順位',
  bracket: '本戦トーナメント',
  logo: '幕間・ロゴ',
};
export const reasons = [
  'points',
  'put',
  'surround',
  'disconnect',
  'illegal-move',
  'self-surround',
] as const;
export type Reason = (typeof reasons)[number];
export const reasonLabels: Record<Reason, string> = {
  points: 'スコア比較',
  put: '相手を埋めた',
  surround: '相手を囲んだ',
  disconnect: '相手の通信切断',
  'illegal-move': '相手が自ら壁に埋まった',
  'self-surround': '相手が自ら周りを囲んだ',
};
export const reasonGroups = [
  ['points'],
  ['put', 'surround'],
  ['disconnect', 'illegal-move', 'self-surround'],
] as const satisfies readonly (readonly Reason[])[];
const id = z.string().min(1).max(100);
const label = z.string().trim().min(1).max(60);
export const playerSchema = z.object({
  id,
  name: label,
  affiliation: z.string().max(60),
  group: z.string().trim().min(1).max(12),
});
export type Player = z.infer<typeof playerSchema>;
export const gameSchema = z.object({
  number: z.union([z.literal(1), z.literal(2)]),
  scoreA: z.number().int().min(0).max(999),
  scoreB: z.number().int().min(0).max(999),
  reason: z.enum(reasons),
  specialWinner: z.enum(['a', 'b']).nullable(),
  remainingTurns: z.number().int().min(0).max(999),
});
export type Game = z.infer<typeof gameSchema>;
export const matchSchema = z.object({
  id,
  label,
  stage: z.enum(['qualifying', 'finals']),
  group: z.string(),
  a: id.nullable(),
  b: id.nullable(),
  sources: z.tuple([id.nullable(), id.nullable()]),
  round: z.number().int().min(0),
  firstCool: id.nullable(),
  started: z.boolean(),
  bye: z.boolean(),
  games: z.array(gameSchema).max(2),
  attempt: z.number().int().positive(),
  previousAttempts: z.array(
    z.object({
      games: z.array(gameSchema),
      firstCool: id.nullable(),
      reason: z.string(),
      at: z.string(),
    }),
  ),
});
export type Match = z.infer<typeof matchSchema>;
export const cueSchema = z.object({ id, label, scene: z.enum(scenes), phase: z.enum(phases) });
export type Cue = z.infer<typeof cueSchema>;
export const stateSchema = z.object({
  schemaVersion: z.literal(1),
  tournamentId: id,
  revision: z.number().int().nonnegative(),
  updatedAt: z.string(),
  demo: z.boolean(),
  ruleVersion: z.literal('2026-09-18.1').default('2026-09-18.1'),
  boardPage: z.number().int().nonnegative().default(0),
  title: label,
  subtitle: z.string().max(120),
  phase: z.enum(phases),
  scene: z.enum(scenes),
  profile: z.enum(['kushiro', 'asahikawa']),
  advancePerGroup: z.number().int().min(1).max(8),
  players: z.array(playerSchema).max(128),
  matches: z.array(matchSchema),
  currentMatchId: id.nullable(),
  logo: z.string().max(1_500_000).nullable(),
  cues: z.array(cueSchema).max(40),
  cueId: id.nullable(),
  audit: z.array(z.object({ id, at: z.string(), action: z.string(), detail: z.string() })),
});
export type ControlState = z.infer<typeof stateSchema>;
export type Profile = ControlState['profile'];
export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('show'), scene: z.enum(scenes), phase: z.enum(phases) }),
  z.object({ type: z.literal('board-page'), page: z.number().int().min(0).max(255) }),
  z.object({ type: z.literal('select-match'), matchId: id }),
  z.object({ type: z.literal('start-match'), matchId: id, firstCool: id }),
  z.object({
    type: z.literal('save-game'),
    matchId: id,
    game: gameSchema,
    correction: z.string().trim().max(300),
  }),
  z.object({ type: z.literal('replay'), matchId: id, reason: z.string().trim().min(1).max(300) }),
  z.object({ type: z.literal('save-player'), player: playerSchema }),
  z.object({ type: z.literal('remove-player'), playerId: id }),
  z.object({ type: z.literal('generate-qualifying') }),
  z.object({
    type: z.literal('generate-finals'),
    qualifiers: z.array(id).min(2).max(128),
    justification: z.string().trim().max(300),
  }),
  z.object({
    type: z.literal('settings'),
    title: label,
    subtitle: z.string().max(120),
    profile: z.enum(['kushiro', 'asahikawa']),
    advancePerGroup: z.number().int().min(1).max(8),
  }),
  z.object({
    type: z.literal('logo'),
    data: z
      .string()
      .max(1_500_000)
      .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
      .nullable(),
  }),
  z.object({ type: z.literal('save-cues'), cues: z.array(cueSchema).min(1).max(40) }),
  z.object({ type: z.literal('play-cue'), cueId: id }),
  z.object({ type: z.literal('reset'), demo: z.boolean(), confirmation: z.literal('RESET') }),
]);
export type Command = z.infer<typeof commandSchema>;
export const requestSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  command: commandSchema,
});
