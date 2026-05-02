/**
 * POST /api/ai/build-from-prompt
 *
 * Single-prompt website builder endpoint.
 * Takes a natural language description and builds a complete website:
 *   1. Detect industry from prompt
 *   2. Extract business name, style, tone
 *   3. Optionally enhance section content with Ollama
 *   4. Create project via filesystem API
 *   5. Save all sections
 *   6. Return project ID for redirect
 *
 * Body: { prompt: string, industry?: IndustryKey, style?: string }
 * Response: { projectId: string, projectName: string, industry: string, pagesCreated: number, sectionsCreated: number, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProject, saveProject, saveSection } from '@/lib/projects';
import {
  detectIndustry, extractBusinessName, extractStyle, getTemplate,
  INDUSTRY_META, type IndustryKey,
} from '@/lib/ai/industry-templates';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

// ── ID generator ─────────────────────────────────────────────────────────

function generateSectionId(type: string): string {
  const short = type.replace(/-/g, '').slice(0, 6);
  return `${short}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Ollama: enhance section content ──────────────────────────────────────

async function enhanceSectionSettings(
  sectionType: string,
  currentSettings: Record<string, unknown>,
  businessName: string,
  industry: IndustryKey,
  prompt: string,
  model: string,
): Promise<Record<string, unknown>> {
  try {
    const systemPrompt = `You are an expert website copywriter. Given section settings, improve the copy to match the business context. Return ONLY valid JSON with the same keys as the input. Do not add new keys. Keep it concise and compelling.`;
    const userPrompt = `Business: "${businessName}" (${industry} industry)
User prompt: "${prompt.slice(0, 200)}"
Section type: ${sectionType}
Current settings: ${JSON.stringify(currentSettings, null, 2)}

Return improved settings JSON. Only change text/copy values (headline, subheadline, title, subtitle, content, ctaText, buttonText). Keep all other values identical.`;

    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: { num_predict: 600, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return currentSettings;
    const data = (await res.json()) as { response: string };

    // Extract JSON from response
    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return currentSettings;

    const enhanced = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    // Merge: only update string values (copy), keep structure intact
    const merged = { ...currentSettings };
    for (const [k, v] of Object.entries(enhanced)) {
      if (typeof v === 'string' && typeof merged[k] === 'string' && v.length > 0) {
        merged[k] = v;
      }
    }
    return merged;
  } catch {
    return currentSettings;
  }
}

// ── Get active Ollama model ───────────────────────────────────────────────

async function getOllamaModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const installed = data.models.map((m) => m.name);
    const PREFERRED = ['qwen2.5-coder:1.5b', 'phi3:mini', 'phi3.5:mini', 'llama3.2:3b', 'mistral:7b'];
    return PREFERRED.find((p) => installed.some((m) => m.startsWith(p.split(':')[0]))) ?? installed[0] ?? null;
  } catch {
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      prompt: string;
      industry?: IndustryKey;
      style?: string;
    };

    const { prompt } = body;
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // ── Step 1: Intent detection ──────────────────────────────────────
    const industry = body.industry ?? detectIndustry(prompt);
    const businessName = extractBusinessName(prompt, industry);
    const style = extractStyle(prompt);
    const meta = INDUSTRY_META[industry];

    // ── Step 2: Get template ──────────────────────────────────────────
    const template = getTemplate(industry, businessName);

    // ── Step 3: Check Ollama availability ────────────────────────────
    const model = await getOllamaModel();
    const ollamaAvailable = !!model;

    // Enhance only hero section (quick) + optionally more if fast model
    const ENHANCE_TYPES = ollamaAvailable
      ? ['hero', 'rich-text', 'newsletter', 'announcement']
      : [];

    // ── Step 4: Create project ────────────────────────────────────────
    // Build a safe project ID from business name
    const safeId = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40);

    const uniqueId = `${safeId}-${Date.now().toString(36)}`;

    // Create project with industry theme
    const project = await createProject(businessName, `${meta.name} website built from: "${prompt.slice(0, 100)}"`);

    // Override the auto-generated ID with our unique one — patch the filesystem
    // Actually, createProject uses name-based ID, let's work with what we get
    const projectId = project.id;

    // Apply industry theme
    project.theme = {
      ...project.theme,
      primaryColor: meta.palette.primary,
      secondaryColor: meta.palette.secondary,
      accentColor: meta.palette.accent,
      fontFamily: meta.fontFamily,
    };

    // ── Step 5: Build pages & sections ───────────────────────────────
    const pagesWithSectionIds: typeof project.pages = [];
    let totalSections = 0;

    for (const templatePage of template.pages) {
      const pageSectionIds: string[] = [];

      for (const sectionDef of templatePage.sections) {
        const sectionId = generateSectionId(sectionDef.type);

        // Optionally enhance content with AI
        let settings = sectionDef.settings;
        if (ollamaAvailable && model && ENHANCE_TYPES.includes(sectionDef.type)) {
          settings = await enhanceSectionSettings(
            sectionDef.type, settings, businessName, industry, prompt, model
          );
        }

        const section = {
          id: sectionId,
          type: sectionDef.type,
          name: sectionDef.name,
          settings,
        };

        await saveSection(projectId, section);
        pageSectionIds.push(sectionId);
        totalSections++;
      }

      pagesWithSectionIds.push({
        id: templatePage.id,
        name: templatePage.name,
        slug: templatePage.slug,
        sections: pageSectionIds,
        seo: templatePage.seo,
      });
    }

    // Update project with pages
    project.pages = pagesWithSectionIds;

    // Set homepage SEO
    if (template.pages[0]?.seo) {
      const homePage = project.pages[0];
      if (homePage) {
        homePage.seo = {
          title: template.pages[0].seo?.title?.replace(/Your (?:Site|Store|Business)/g, businessName),
          description: template.pages[0].seo?.description,
        };
      }
    }

    await saveProject(project);

    // ── Step 6: Return result ─────────────────────────────────────────
    return NextResponse.json({
      projectId,
      projectName: businessName,
      industry,
      industryName: meta.name,
      industryEmoji: meta.emoji,
      pagesCreated: template.pages.length,
      sectionsCreated: totalSections,
      aiEnhanced: ollamaAvailable,
      message: ollamaAvailable
        ? `Built "${businessName}" with AI-enhanced content — ${totalSections} sections across ${template.pages.length} pages`
        : `Built "${businessName}" with ${totalSections} sections across ${template.pages.length} pages`,
    });

  } catch (e) {
    console.error('[build-from-prompt]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
