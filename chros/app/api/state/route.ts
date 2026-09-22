import { requestSchema } from '@chros/shared';
import { dispatch, readState, RevisionConflict } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_REQUEST_LENGTH = 2_000_000;

export function GET() {
  return Response.json(readState(), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    new URL(origin).host !== request.headers.get('host')
  ) {
    return Response.json({ error: '異なるサイトからの操作は受け付けません。' }, { status: 403 });
  }

  const body = await request.text();
  if (body.length > MAX_REQUEST_LENGTH) {
    return Response.json({ error: 'データが大きすぎます。' }, { status: 413 });
  }

  let input;
  try {
    input = requestSchema.safeParse(JSON.parse(body));
  } catch {
    return Response.json({ error: '入力形式が不正です。' }, { status: 400 });
  }
  if (!input.success) {
    const validationErrors = input.error.issues.map((issue) => issue.message).join(' / ');
    return Response.json(
      {
        error: `入力内容を確認してください: ${validationErrors}`,
      },
      { status: 400 },
    );
  }

  try {
    return Response.json(dispatch(input.data.command, input.data.expectedRevision));
  } catch (error) {
    const conflict = error instanceof RevisionConflict;
    return Response.json(
      {
        error: error instanceof Error ? error.message : '保存できませんでした。',
        ...(conflict ? { state: readState() } : {}),
      },
      { status: conflict ? 409 : 400 },
    );
  }
}
