import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  sectionType: string;
  prompt: string;
  currentSettings?: Record<string, unknown>;
}

function titleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function seedFromPrompt(prompt: string): string {
  // Extract the core noun/topic from the prompt
  const cleaned = prompt.trim().replace(/[^a-zA-Z0-9 ]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, 3).join(" ") || "your store";
}

function generateHero(prompt: string): Record<string, unknown> {
  const seed = seedFromPrompt(prompt);
  const topic = titleCase(seed);
  return {
    heading: `Discover ${topic}`,
    subheading: `Handcrafted with care — explore our collection of ${seed.toLowerCase()} and find something truly unique.`,
    cta_text: "Shop Now",
    cta_url: "/products",
  };
}

function generateNewsletter(prompt: string): Record<string, unknown> {
  const seed = seedFromPrompt(prompt);
  return {
    headline: `Stay in the loop`,
    description: `Get the latest on ${seed.toLowerCase()}, new arrivals, and exclusive offers delivered straight to your inbox.`,
    button_text: "Subscribe",
    placeholder: "your@email.com",
  };
}

function generateRichText(prompt: string): Record<string, unknown> {
  const seed = seedFromPrompt(prompt);
  return {
    content: `<p>Welcome to our world of <strong>${seed}</strong>. We believe that quality and craftsmanship matter — every piece tells a story.</p><p>Whether you're looking for a gift or treating yourself, you'll find something special here. Explore our full range and discover what sets us apart.</p>`,
  };
}

function generateFallback(sectionType: string): Record<string, unknown> {
  return {
    _ai_note: `AI generation for "${sectionType}" sections is coming soon. Edit the fields above to customise this section.`,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { sectionType, prompt } = body;

    if (!sectionType || !prompt) {
      return NextResponse.json(
        { error: "sectionType and prompt are required" },
        { status: 400 }
      );
    }

    let settings: Record<string, unknown>;

    switch (sectionType) {
      case "hero":
        settings = generateHero(prompt);
        break;
      case "newsletter":
        settings = generateNewsletter(prompt);
        break;
      case "rich-text":
        settings = generateRichText(prompt);
        break;
      default:
        settings = generateFallback(sectionType);
    }

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
