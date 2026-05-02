/**
 * Forge Builder — AI Builder Tools
 *
 * Defines the complete set of tools the AI agent can call to interact
 * with the builder. This is the bridge between natural language intent
 * and concrete builder state mutations.
 *
 * Server side: tool schemas in the system prompt (tells LLM what's available)
 * Client side: tool executor (calls Zustand store actions)
 *
 * Design: all mutations are performed CLIENT-SIDE via the builder store
 * so they participate in undo history and live-update the canvas.
 */

// ── Tool type definitions ─────────────────────────────────────────────────

export type ToolName =
  | 'add_section'
  | 'update_section'
  | 'remove_section'
  | 'duplicate_section'
  | 'reorder_section'
  | 'update_brand_kit'
  | 'add_page'
  | 'select_section'
  | 'generate_content'
  | 'search_web'
  | 'set_seo';

export interface ToolCall {
  tool: ToolName;
  params: Record<string, unknown>;
  // Populated after execution
  result?: ToolResult;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface AgentResponse {
  thoughts?: string;              // AI's reasoning (shown in thinking state)
  message: string;                // Human-readable reply shown in chat
  actions: ToolCall[];            // Tools to execute
  followUp?: string;              // Optional follow-up question
  needsWebSearch?: boolean;       // Did the AI say it needs to look something up?
}

// ── Schema for the system prompt ──────────────────────────────────────────
// This is injected into the AI's system prompt so it knows what tools exist.

export const TOOL_SCHEMAS = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE TOOLS (call these to interact with the builder)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

add_section(pageId, sectionType, position?)
  → Adds a new section. sectionType must be one of the 28 registered types.
  → position: 0-based index. Omit to append at end.
  → Example: {"tool":"add_section","params":{"pageId":"page-1","sectionType":"testimonials"}}

update_section(sectionId, settings)
  → Updates settings fields of an existing section. Merges — no need to send all fields.
  → Example: {"tool":"update_section","params":{"sectionId":"sec-abc","settings":{"headline":"New headline","cta_text":"Shop Now"}}}

remove_section(sectionId)
  → Removes a section permanently.
  → Example: {"tool":"remove_section","params":{"sectionId":"sec-abc"}}

duplicate_section(sectionId)
  → Duplicates a section directly below its current position.

reorder_section(pageId, sectionId, direction)
  → Moves section up or down. direction: "up" | "down"

update_brand_kit(theme)
  → Updates brand colours/fonts globally. Fields: primary, secondary, accent, background, text, headingFont, bodyFont
  → Example: {"tool":"update_brand_kit","params":{"theme":{"primary":"#1a1a2e","accent":"#d4af37"}}}

add_page(name, path?)
  → Creates a new page. path defaults to /name-slugified.
  → Example: {"tool":"add_page","params":{"name":"About Us","path":"/about"}}

select_section(sectionId)
  → Focuses and scrolls to a section in the inspector.

set_seo(pageId, title, description, ogImage?)
  → Sets the SEO meta for a page.

generate_content(sectionType, brief)
  → Generates realistic settings for a section type based on a creative brief.
  → Returns settings object. Use with update_section to apply.
  → Example: {"tool":"generate_content","params":{"sectionType":"hero","brief":"luxury diamond engagement rings, elegant dark theme"}}

search_web(query)
  → Searches the web for information and returns a summary.
  → Use when you need current data, specific facts, or best practices not in your training.
  → Example: {"tool":"search_web","params":{"query":"jewellery store conversion rate best practices 2024"}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO RESPOND WHEN TAKING ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When performing builder tasks, respond ONLY with a JSON object:
{
  "thoughts": "Brief reasoning (not shown to user)",
  "message": "What you're doing, written for the user (conversational, friendly)",
  "actions": [
    {"tool": "tool_name", "params": {...}},
    {"tool": "tool_name", "params": {...}}
  ],
  "followUp": "Optional: a clarifying question if needed"
}

When just chatting (no actions needed), respond normally in plain text.
If unsure whether actions are needed, ask first.
Always prefer completing the task to asking for permission — the user can undo.
`;

// ── Builder project snapshot type ─────────────────────────────────────────

export interface ProjectSnapshot {
  id: string;
  name: string;
  currentPageId: string | null;
  pages: Array<{
    id: string;
    name: string;
    path?: string;
    sections: Array<{
      id: string;
      type: string;
      name?: string;
      settings?: Record<string, unknown>;
    }>;
    seo?: { title?: string; description?: string };
  }>;
  theme?: Record<string, unknown>;
}

export function snapshotProject(project: unknown, currentPageId: string | null): ProjectSnapshot {
  const p = project as {
    id: string;
    name: string;
    pages?: unknown[];
    theme?: Record<string, unknown>;
  };
  return {
    id: p.id,
    name: p.name,
    currentPageId,
    pages: (p.pages ?? []).map((page) => {
      const pg = page as {
        id: string;
        name: string;
        path?: string;
        seo?: { title?: string; description?: string };
        sections?: unknown[];
      };
      return {
        id: pg.id,
        name: pg.name,
        path: pg.path,
        seo: pg.seo,
        sections: (pg.sections ?? []).map((sec) => {
          const s = sec as { id: string; type: string; name?: string; settings?: Record<string, unknown> };
          return { id: s.id, type: s.type, name: s.name, settings: s.settings };
        }),
      };
    }),
    theme: p.theme,
  };
}

// ── JSON extraction helper ─────────────────────────────────────────────────

export function extractAgentResponse(raw: string): AgentResponse | null {
  // Try to find a JSON object in the response
  const patterns = [
    /```(?:json)?\s*(\{[\s\S]+?\})\s*```/,
    /(\{[\s\S]*?"message"[\s\S]*?"actions"[\s\S]*?\})/,
    /(\{[\s\S]*?"actions"[\s\S]*?"message"[\s\S]*?\})/,
    /(\{[\s\S]+\})/,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]) as AgentResponse;
        if (parsed.message && Array.isArray(parsed.actions)) {
          return parsed;
        }
      } catch { /* try next */ }
    }
  }

  // Plain text — no actions
  return {
    message: raw.trim(),
    actions: [],
    thoughts: undefined,
  };
}
