import { exportResultsCsv } from '@/lib/export-results';
import { readState } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  const state = readState();
  const format = new URL(request.url).searchParams.get('format') === 'csv' ? 'csv' : 'json';
  const content = format === 'csv' ? exportResultsCsv(state) : JSON.stringify(state, null, 2);
  const contentType = format === 'csv' ? 'text/csv' : 'application/json';
  const date = new Date().toISOString().slice(0, 10);

  return new Response(content, {
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="chros-${date}.${format}"`,
      'Cache-Control': 'no-store',
    },
  });
}
