import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Sparkles, RotateCcw } from "lucide-react";
import LediLogo from "@/components/LediLogo";

interface Message {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const SUGGESTED = [
  "Hvordan registrerer jeg plassen min?",
  "Hva koster det å leie ut?",
  "Finn meg parkering nær Oslo Sentrum",
  "Hva er Smart Pris?",
];

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-4">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#00B4D8" }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg, #00B4D8, #0284C7)" }}>
          <Bot size={14} color="white" />
        </div>
      )}
      <div
        className="max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={isUser ? {
          background: "linear-gradient(135deg, #00B4D8, #0284C7)",
          color: "#fff",
          borderBottomRightRadius: 6,
        } : {
          background: "rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.88)",
          borderBottomLeftRadius: 6,
        }}
      >
        {msg.loading ? <TypingDots /> : msg.content}
      </div>
    </motion.div>
  );
}

export default function LediAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hei! Jeg er Ledi AI 👋 Jeg kan hjelpe deg finne parkering, svare på spørsmål om utleie, priser og bookinger. Hva lurer du på?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || streaming) return;

    setInput("");
    const userMsg: Message = { role: "user", content: userText };
    const loadingMsg: Message = { role: "assistant", content: "", loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error("Ingen respons");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, loading: false, content: "" } : m
      ));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullText += data.content;
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: fullText } : m
              ));
            }
            if (data.done || data.error) break;
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1
          ? { ...m, loading: false, content: "Beklager, noe gikk galt. Prøv igjen. 🙏" }
          : m
      ));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([{
      role: "assistant",
      content: "Hei! Jeg er Ledi AI 👋 Jeg kan hjelpe deg finne parkering, svare på spørsmål om utleie, priser og bookinger. Hva lurer du på?",
    }]);
    setInput("");
    setStreaming(false);
  };

  return (
    <>
      {/* Floating chat button — sits above SOS button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-white text-sm shadow-2xl"
        style={{
          bottom: "5.5rem",
          right: "1.5rem",
          background: open
            ? "rgba(0,180,216,0.2)"
            : "linear-gradient(135deg, #00B4D8, #0284C7)",
          boxShadow: open ? "none" : "0 4px 24px rgba(0,180,216,0.45)",
          border: open ? "1px solid rgba(0,180,216,0.4)" : "none",
        }}
        aria-label="Ledi AI Chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={16} />
            </motion.span>
          ) : (
            <motion.span key="spark" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles size={16} />
            </motion.span>
          )}
        </AnimatePresence>
        <span>{open ? "Lukk" : <><LediLogo size={14} /> AI</>}</span>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed z-40 flex flex-col"
            style={{
              bottom: "9.5rem",
              right: "1.5rem",
              width: 360,
              maxWidth: "calc(100vw - 2rem)",
              height: 520,
              maxHeight: "calc(100vh - 11rem)",
              background: "#0D1B2A",
              border: "1px solid rgba(0,180,216,0.2)",
              borderRadius: 24,
              boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,180,216,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3 shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.12), rgba(2,132,199,0.06))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #00B4D8, #0284C7)" }}>
                <Bot size={16} color="white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white inline-flex items-center gap-1" style={{ fontFamily: "Syne, sans-serif" }}><LediLogo size={14} /> AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981", boxShadow: "0 0 4px #10B981" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Alltid tilgjengelig</span>
                </div>
              </div>
              <button
                onClick={reset}
                title="Start ny samtale"
                className="p-1.5 rounded-xl transition-colors hover:bg-white/10 text-white/30 hover:text-white/70"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}

              {/* Suggested questions — only after first greeting */}
              {messages.length === 1 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5 pt-1">
                  {SUGGESTED.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: "rgba(0,180,216,0.07)",
                        border: "1px solid rgba(0,180,216,0.18)",
                        color: "#00B4D8",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Skriv en melding…"
                  disabled={streaming}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: input.trim() && !streaming
                      ? "linear-gradient(135deg, #00B4D8, #0284C7)"
                      : "rgba(255,255,255,0.07)",
                    color: input.trim() && !streaming ? "#fff" : "rgba(255,255,255,0.25)",
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                Ledi AI · Kan ta feil — verifiser viktig info
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
