import React, { useState } from "react";
import { ConversationAnswer } from "../types";
import { MessageCircle, Send, Trash } from "lucide-react";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";

interface ConversationPrompt {
  id: string;
  category: string;
  question: string;
}

interface ConversationHubViewProps {
  prompts: ConversationPrompt[];
  answers: ConversationAnswer[];
  onAnswer: (promptId: string, question: string, answeredBy: "Him" | "Her" | "Together", answer: string) => void;
  onDeleteAnswer: (id: string) => void;
}

export default function ConversationHubView({ prompts, answers, onAnswer, onDeleteAnswer }: ConversationHubViewProps) {
  const [filterCat, setFilterCat] = useState<string>("All");
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [answeredBy, setAnsweredBy] = useState<"Him" | "Her" | "Together">("Together");

  const categories = ["All", ...Array.from(new Set(prompts.map((p) => p.category)))];
  const filtered = filterCat === "All" ? prompts : prompts.filter((p) => p.category === filterCat);

  const handleSubmit = (prompt: ConversationPrompt) => {
    if (!draft.trim()) return;
    onAnswer(prompt.id, prompt.question, answeredBy, draft);
    setDraft("");
    setActivePromptId(null);
  };

  return (
    <div className="space-y-8" id="conversation-hub-module">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-red-500 animate-pulse" />
            Conversation Hub
          </h2>
          <p className="text-sm text-neutral-400">Questions worth slowing down for. Answer one, save it, come back to it later.</p>
        </div>
        <div className="flex items-center gap-2 bg-luxury-950/60 p-1.5 rounded-2xl border border-white/5">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-xs bg-transparent text-neutral-300 border-none outline-none px-2 py-1 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-luxury-950">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((prompt, index) => (
          <Reveal key={prompt.id} delay={Math.min(index * 0.04, 0.3)}>
            <div className="bg-luxury-900/40 border border-luxury-800 hover:border-luxury-700 rounded-3xl p-6 space-y-4 transition-all duration-300">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border text-red-400 border-red-500/20 bg-red-500/5">
                {prompt.category}
              </span>
              <p className="font-serif text-lg text-neutral-100 leading-relaxed">{prompt.question}</p>

              {activePromptId === prompt.id ? (
                <div className="space-y-3 pt-2">
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder="Your answer..."
                    className="w-full bg-luxury-950 border border-luxury-800 focus:border-red-700 rounded-xl p-3 text-sm text-white focus:outline-none transition resize-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={answeredBy}
                      onChange={(e) => setAnsweredBy(e.target.value as any)}
                      className="text-[11px] bg-luxury-950 border border-luxury-800 rounded-lg px-2 py-1.5 text-neutral-300 focus:outline-none"
                    >
                      <option value="Together">Together</option>
                      <option value="Him">Him</option>
                      <option value="Her">Her</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setActivePromptId(null); setDraft(""); }}
                        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white border border-luxury-800 rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <MagneticButton
                        onClick={() => handleSubmit(prompt)}
                        className="px-3 py-1.5 text-xs bg-red-900/60 hover:bg-red-800 border border-red-700/50 text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> Save
                      </MagneticButton>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActivePromptId(prompt.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-mono uppercase tracking-wide transition cursor-pointer"
                >
                  + Answer this
                </button>
              )}

              {answers.filter((a) => a.promptId === prompt.id).map((a) => (
                <div key={a.id} className="bg-luxury-950/60 rounded-xl p-3 border border-luxury-800/60 flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase">{a.answeredBy} - {new Date(a.timestamp).toLocaleDateString()}</span>
                    <p className="text-xs text-neutral-300 italic">"{a.answer}"</p>
                  </div>
                  <button onClick={() => onDeleteAnswer(a.id)} className="text-neutral-600 hover:text-red-400 transition shrink-0">
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
