import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Mic, Volume2, Bot, User as UserIcon } from "lucide-react";
import { useAuth } from "../App";
import { getChatHistory, sendChatMessage, ChatMessage as ChatMessageType } from "../api";
import { useVoice } from "../hooks/useVoice";
import { COLORS } from "../design-system/brand";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "ta", label: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd" },
];

export default function AIAssistant() {
  const { me } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [sending, setSending] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { supported: voiceSupported, listening, transcript, startListening, speak } = useVoice(language);

  useEffect(() => {
    if (!me) return;
    getChatHistory(me.weaver.id).then(setMessages);
  }, [me]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!me || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", message: text, language, created_at: new Date().toISOString() }]);
    const result = await sendChatMessage(me.weaver.id, text, language);
    setMessages((prev) => [...prev, { role: "assistant", message: result.reply_text, language, created_at: new Date().toISOString() }]);
    if (voiceReplies) speak(result.reply_text);
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
            AI Weaver Consultant
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
            Ask about demand, production, raw materials, pricing, or inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm border rounded-lg px-2.5 py-1.5"
            style={{ borderColor: "#EAE4D6", color: COLORS.charcoalText }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button
            onClick={() => setVoiceReplies((v) => !v)}
            title={voiceSupported ? "Toggle spoken replies" : "Voice not supported in this browser"}
            disabled={!voiceSupported}
            className="p-2 rounded-lg border disabled:opacity-40"
            style={{ borderColor: "#EAE4D6", backgroundColor: voiceReplies ? `${COLORS.emeraldDeep}12` : "transparent" }}
          >
            <Volume2 size={16} style={{ color: COLORS.emeraldDeep }} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border p-5 space-y-4"
        style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
      >
        {messages.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>
            Start the conversation &mdash; try "What's the demand like right now?"
          </p>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${COLORS.emeraldDeep}15` }}>
                <Bot size={14} style={{ color: COLORS.emeraldDeep }} />
              </div>
            )}
            <div
              className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
              style={{
                backgroundColor: m.role === "user" ? COLORS.emeraldDeep : "#F4F1E9",
                color: m.role === "user" ? COLORS.warmWhite : COLORS.charcoalText,
              }}
            >
              {m.message}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${COLORS.gold}25` }}>
                <UserIcon size={14} style={{ color: COLORS.emeraldDeep }} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={startListening}
          disabled={!voiceSupported}
          title={voiceSupported ? "Speak your question" : "Voice input not supported in this browser"}
          className="p-3 rounded-xl border disabled:opacity-40"
          style={{ borderColor: "#EAE4D6", backgroundColor: listening ? `${COLORS.gold}25` : COLORS.warmWhite }}
        >
          <Mic size={18} style={{ color: listening ? COLORS.gold : COLORS.emeraldDeep }} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type or speak your question..."
          className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
          style={{ borderColor: "#EAE4D6" }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="p-3 rounded-xl text-white disabled:opacity-50"
          style={{ backgroundColor: COLORS.emeraldDeep }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}