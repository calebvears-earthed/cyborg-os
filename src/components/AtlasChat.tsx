"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AtlasChat({ sessionId = "default" }: { sessionId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load existing conversation on mount
  useEffect(() => {
    fetch(`/api/history?sessionId=${sessionId}`)
      .then((r) => r.ok ? r.json() : { messages: [] })
      .then((data) => {
        if (data.messages?.length) setMessages(data.messages);
      })
      .catch(() => {});
  }, [sessionId]);

  async function send() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    const messageText = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, sessionId }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulated += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: accumulated };
          return copy;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "[Atlas connection error · retry]" };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-void">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-plum/30">
        <div className="atlas-orb w-3 h-3 rounded-full" />
        <h1 className="font-display italic text-xl text-cream">Atlas</h1>
        <span className="text-xs font-mono text-plum-light">online · session {sessionId.slice(0, 8)}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-plum-light mt-20">
            <div className="atlas-orb w-16 h-16 rounded-full mx-auto mb-4" />
            <p className="font-display italic text-lg text-cream">Atlas is ready.</p>
            <p className="text-sm mt-2">Memory loaded. Jobs tracked. OneDrive wired. What's on?</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-3xl px-5 py-3 rounded-xl ${
                m.role === "user"
                  ? "bg-plum text-cream"
                  : "bg-void-elevated border border-plum/30 text-cream"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose-atlas">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "..."}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-plum/30 px-6 py-4 bg-void-soft">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            placeholder="Message Atlas..."
            rows={3}
            className="w-full px-4 py-3 pr-16 bg-void-elevated border border-plum/40 rounded-xl text-cream placeholder-plum-light/60 focus:outline-none focus:border-violet font-body resize-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="absolute right-3 bottom-3 px-4 py-2 bg-violet hover:bg-violet-light disabled:bg-plum/40 disabled:text-plum-light rounded-lg text-cream font-medium transition text-sm"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-plum-light/60 mt-2 font-mono">
          Enter to send · Shift+Enter for new line · 👾
        </p>
      </div>
    </div>
  );
}
