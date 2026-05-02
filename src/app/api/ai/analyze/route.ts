/**
 * POST /api/ai/analyze
 *
 * Runs SAST + drift detection on the current project state.
 * Also generates auto-suggestions and an AI-written narrative summary.
 *
 * Body: { project: ProjectSnapshot }
 * Response: { sast, drift, suggestions, score, summary, provider }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSAST, calculateScore } from '@/lib/ai/sast';
import { detectDrift } from '@/lib/ai/drift-detector';
import { generateSuggestions } from '@/lib/ai/auto-suggest';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

async function generateNarrativeSummary(
  score: number,
  sastCount: { critical: number; high: number; medium: number },
  driftCount: number,
  model: string | null
): Promise<string> {
  if (!model) {
    // Rule-based summary
    if (score >= 90) return `Your site is in excellent shape (score: ${score}/100). Minor improvements available below.`;
    if (score >= 70) return `Good foundation (score: ${score}/100). ${sastCount.high} high-priority issue(s) and ${driftCount} configuration drift item(s) need attention.`;
    return `Several issues need attention (score: ${score}/100). Focus on the ${sastCount.critical + sastCount.high} critical/high issues first.`;
  }

  const prompt = `You are a web quality analyst reviewing a jewellery e-commerce site built with Forge Builder.

Site quality score: ${score}/100
SAST findings: ${sastCount.critical} critical, ${sastCount.high} high, ${sastCount.medium} medium
Configuration drift items: ${driftCount}

Write a 2-sentence executive summary of the site's quality. Be specific, constructive, and mention the score. Do not list every issue — just give an overall picture and top priority.`;

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { num_predict: 150, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error('Ollama unavailable');
    const data = (await res.json()) as { response: string };
    return data.response.trim();
  } catch {
    return `Site quality score: ${score}/100. ${sastCount.critical + sastCount.high} high-priority issue(s) detected — review the findings below to improve your site.`;
  }
}

async function getActiveModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const PREFERRED = ['qwen2.5-coder:1.5b', 'phi3:mini', 'phi3.5:mini', 'llama3.2:3b'];
    const installed = data.models.map((m) => m.name);
    return PREFERRED.find((p) => installed.some((m) => m.startsWith(p.split(':')[0]))) ?? installed[0] ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { project: Record<string, unknown> };
    const { project } = body;

    if (!project) {
      return NextResponse.json({ error: 'project required' }, { status: 400 });
    }

    // Cast via unknown to satisfy strict interface requirements — we trust the client sends the right shape
    const typedProject = project as unknown as Parameters<typeof runSAST>[0];
    const [sast, drift, suggestions, model] = await Promise.all([
      Promise.resolve(runSAST(typedProject)),
      Promise.resolve(detectDrift(typedProject as unknown as Parameters<typeof detectDrift>[0])),
      Promise.resolve(generateSuggestions(typedProject as unknown as Parameters<typeof generateSuggestions>[0])),
      getActiveModel(),
    ]);

    const score = calculateScore(sast);

    const sastCount = {
      critical: sast.filter((f) => f.severity === 'critical').length,
      high: sast.filter((f) => f.severity === 'high').length,
      medium: sast.filter((f) => f.severity === 'medium').length,
      low: sast.filter((f) => f.severity === 'low').length,
      info: sast.filter((f) => f.severity === 'info').length,
    };

    const summary = await generateNarrativeSummary(score, sastCount, drift.length, model);

    return NextResponse.json({
      score,
      summary,
      sast,
      sastCount,
      drift,
      suggestions,
      provider: model ? 'ollama' : 'rules-based',
      model,
      analyzedAt: Date.now(),
    });
  } catch (e) {
    console.error('[ai/analyze]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
