"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  fromAdmin: boolean;
  body: string;
  readAt: string | null;
  createdAt: string;
  createdAtFormatted: string;
};

// ─── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

// ─── Skeleton bubble ───────────────────────────────────────────────────────────

function SkeletonBubble({ fromAdmin }: { fromAdmin: boolean }) {
  return (
    <div className={`flex items-end gap-2.5 ${fromAdmin ? "" : "flex-row-reverse"}`}>
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
      <div className={`space-y-1.5 max-w-[65%]`}>
        <div className={`h-10 rounded-2xl bg-slate-200 animate-pulse ${fromAdmin ? "w-52" : "w-44"}`} />
        <div className={`h-3 w-16 rounded bg-slate-100 animate-pulse ${fromAdmin ? "" : "ml-auto"}`} />
      </div>
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isNew }: { msg: Message; isNew?: boolean }) {
  const isAdmin = msg.fromAdmin;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2.5 ${isAdmin ? "" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0
        ${isAdmin ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white" : "bg-slate-200 text-slate-500"}`}>
        {isAdmin ? "BP" : "Me"}
      </div>

      <div className={`flex flex-col gap-1 max-w-[70%] ${isAdmin ? "items-start" : "items-end"}`}>
        {/* Bubble */}
        <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words
          ${isAdmin
            ? "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm"
            : "bg-blue-600 text-white rounded-br-sm"
          }`}>
          {msg.body}
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-1.5 ${isAdmin ? "" : "flex-row-reverse"}`}>
          <span className="text-[11px] text-slate-400">{relativeTime(msg.createdAt)}</span>
          {!isAdmin && msg.readAt && (
            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasFetchedRef = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // ── Fetch messages (also marks admin msgs as read) ──
  const fetchMessages = useCallback(async (isInitial = false) => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        if (isInitial) setTimeout(() => scrollToBottom(false), 50);
      }
    } catch {
      // silent
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchMessages(true);
  }, [fetchMessages]);

  // ── Poll for new messages every 15s ──
  useEffect(() => {
    const id = setInterval(() => fetchMessages(false), 15_000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  // ── Auto-resize textarea ──
  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    setSendError("");
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  // ── Send message ──
  async function sendMessage() {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError("");

    const token = sessionStorage.getItem("access_token") ?? "";
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      fromAdmin: false,
      body: trimmed,
      readAt: null,
      createdAt: new Date().toISOString(),
      createdAtFormatted: "",
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.message ?? "Failed to send. Please try again.");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setDraft(trimmed);
        return;
      }
      // Replace optimistic with server message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? data.message : m))
      );
    } catch {
      setSendError("Network error. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(trimmed);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const charCount = draft.length;
  const overLimit = charCount > 2000;

  // ── Group messages by date ──
  const grouped: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const label = (() => {
      const d = new Date(msg.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });
    })();
    const last = grouped[grouped.length - 1];
    if (last?.date === label) {
      last.messages.push(msg);
    } else {
      grouped.push({ date: label, messages: [msg] });
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* ── Header ── */}
      <div className="bg-white rounded-t-2xl border border-slate-100 border-b-0 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-[13px] flex-shrink-0">
          BP
        </div>
        <div>
          <p className="text-[14px] font-bold text-slate-800">BPoint Support</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[12px] text-slate-400">Online · usually replies within a few hours</p>
          </div>
        </div>
      </div>

      {/* ── Thread ── */}
      <div className="flex-1 overflow-y-auto bg-white border-x border-slate-100 px-6 py-4 space-y-5 min-h-0">
        {loading ? (
          <>
            <SkeletonBubble fromAdmin={true} />
            <SkeletonBubble fromAdmin={false} />
            <SkeletonBubble fromAdmin={true} />
            <SkeletonBubble fromAdmin={false} />
          </>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-bold text-slate-700">No messages yet</p>
              <p className="text-[13px] text-slate-400 mt-1">Send us a message and we'll get back to you.</p>
            </div>
          </div>
        ) : (
          <>
            {grouped.map((group) => (
              <div key={group.date} className="space-y-4">
                {/* Date divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[11px] font-semibold text-slate-400 px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                {group.messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} isNew={msg.id.startsWith("opt-")} />
                ))}
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="bg-white rounded-b-2xl border border-slate-100 border-t border-t-slate-100 px-4 py-3 flex-shrink-0">
        <AnimatePresence>
          {sendError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[12px] text-red-500 mb-2 px-1"
            >
              ⚠ {sendError}
            </motion.p>
          )}
        </AnimatePresence>

        <div className={`flex items-end gap-2 p-1.5 rounded-xl border transition-colors
          ${overLimit ? "border-red-300 bg-red-50/20" : "border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white"}`}>
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 outline-none resize-none px-2 py-1.5 leading-relaxed disabled:opacity-50"
            style={{ minHeight: "36px", maxHeight: "120px" }}
          />
          <div className="flex items-center gap-2 pb-1 pr-1 flex-shrink-0">
            {charCount > 1800 && (
              <span className={`text-[11px] font-semibold ${overLimit ? "text-red-500" : "text-slate-400"}`}>
                {charCount}/2000
              </span>
            )}
            <button
              type="button"
              onClick={sendMessage}
              disabled={!draft.trim() || sending || overLimit}
              className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {user && (
          <p className="text-[11px] text-slate-400 mt-1.5 px-1">
            Messaging as <span className="font-semibold text-slate-500">{user.firstName} {user.lastName}</span>
          </p>
        )}
      </div>
    </div>
  );
}
