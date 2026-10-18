import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const ATLAS_MODEL = process.env.ATLAS_MODEL || "claude-sonnet-4-5-20250929";

export const ATLAS_MAX_TOKENS = 4096;
export const ATLAS_TEMPERATURE = 0.7;
