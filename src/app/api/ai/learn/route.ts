/**
 * POST /api/ai/learn
 *
 * Triggers a background learning cycle — fetches allow-listed web sources,
 * summarises them with Ollama (if running), and stores knowledge items in SQLite.
 *
 * This is called:
 *   - On app startup (if online) — via the AI panel useEffect
 *   - Manually via the "Refresh knowledge" button in the AI panel
 *   - On a schedule if the user has it enabled
 *
 * Body: { force?: boolean }  — force=true re-fetches even if recently done
 * Response: { online, totalItemsLearned, results }
 *
 * GET /api/ai/learn — returns knowledge stats and learn log
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { force?: boolean; maxSources?: number };

    // Dynamic require to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { runLearningCycle } = require('@/lib/ai/self-learner') as typeof import('@/lib/ai/self-learner');

    const result = await runLearningCycle({
      forceRefresh: body.force ?? false,
      maxSources: body.maxSources ?? 10,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('[ai/learn]', e);
    return NextResponse.json({ error: String(e), online: false, results: [], totalItemsLearned: 0 }, { status: 500 });
  }
}

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ks = require('@/lib/ai/knowledge-store') as typeof import('@/lib/ai/knowledge-store');
    const items = ks.getTopKnowledge(100);
    const log = ks.getLearnLog(20);
    const patterns = ks.getTopBuilderPatterns(undefined, 10);

    return NextResponse.json({
      knowledgeCount: items.length,
      categories: [...new Set(items.map((i) => i.category))],
      recentItems: items.slice(0, 10),
      log,
      patterns,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), knowledgeCount: 0 }, { status: 500 });
  }
}
