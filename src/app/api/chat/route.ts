import { NextRequest, NextResponse } from "next/server";
import { anthropic, ATLAS_MODEL, ATLAS_MAX_TOKENS, ATLAS_TEMPERATURE } from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabase";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

// Load Atlas system prompt from markdown file
function loadSystemPrompt(): string {
  const promptPath = path.join(process.cwd(), "src/lib/atlas-system-prompt.md");
  try {
    return fs.readFileSync(promptPath, "utf-8");
  } catch (e) {
    console.error("Failed to load system prompt:", e);
    return "You are Atlas, Caleb's AI collaborator.";
  }
}

// Build context from Supabase memories + recent conversation
async function buildContext(sessionId: string): Promise<string> {
  const context: string[] = [];

  // Load all memories (small table · fine to load all for now)
  const { data: memories } = await supabaseAdmin
    .from("memories")
    .select("name, description, content, type")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (memories && memories.length > 0) {
    context.push("## STORED MEMORIES\n");
    for (const m of memories) {
      context.push(`### [${m.type}] ${m.name}\n${m.description}\n${m.content}\n---`);
    }
  }

  // Load recent conversation history for this session (last 20 messages)
  const { data: history } = await supabaseAdmin
    .from("conversations")
    .select("role, content, tool_name, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (history && history.length > 0) {
    context.push("\n## RECENT CONVERSATION (newest first)\n");
    for (const h of history.reverse()) {
      context.push(`[${h.role}] ${h.content}`);
    }
  }

  return context.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId = "default" } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    // Save user message to Supabase first
    await supabaseAdmin.from("conversations").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    // Build system prompt with context
    const systemPrompt = loadSystemPrompt();
    const context = await buildContext(sessionId);
    const fullSystemPrompt = `${systemPrompt}\n\n${context}`;

    // Build message history for Claude
    const { data: recent } = await supabaseAdmin
      .from("conversations")
      .select("role, content")
      .eq("session_id", sessionId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: false })
      .limit(20);

    const messages = (recent || [])
      .reverse()
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Call Claude with streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: ATLAS_MODEL,
            max_tokens: ATLAS_MAX_TOKENS,
            temperature: ATLAS_TEMPERATURE,
            system: fullSystemPrompt,
            messages,
            stream: true,
          });

          let fullResponse = "";
          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const chunk = event.delta.text;
              fullResponse += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          }

          // Save assistant response to Supabase after stream completes
          await supabaseAdmin.from("conversations").insert({
            session_id: sessionId,
            role: "assistant",
            content: fullResponse,
          });

          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode("\n\n[Atlas error · check server logs]"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
