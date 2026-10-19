import Anthropic from "@anthropic-ai/sdk";

// Lazy instantiation · env read at request time to survive `next build`.

let _anthropic: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

// Back-compat Proxy export
export const anthropic = new Proxy({} as Anthropic, {
  get: (_, prop) => (getAnthropic() as any)[prop],
});

export const ATLAS_MODEL = process.env.ATLAS_MODEL || "claude-sonnet-4-5-20250929";
export const ATLAS_MAX_TOKENS = 4096;
export const ATLAS_TEMPERATURE = 0.7;
