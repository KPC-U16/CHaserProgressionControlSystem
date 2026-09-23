import { readState } from '@/lib/store';
export const dynamic = 'force-dynamic';
export function GET() {
  const state = readState();
  return Response.json({ screen: state.scene, phase: state.phase, revision: state.revision });
}
export function POST() {
  return Response.json(
    { error: '画面変更は /api/state の show コマンドを使用してください。' },
    { status: 410 },
  );
}
