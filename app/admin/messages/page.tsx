"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Conversation = {
  userId: string;
  userName: string;
  userEmail: string;
  lastBody: string;
  lastFromAdmin: boolean;
  lastAt: string;
  unread: number;
};

type ThreadMessage = {
  id: string;
  fromAdmin: boolean;
  body: string;
  readAt: string | null;
  createdAt: string;
  createdAtFormatted: string;
};

type ThreadUser = { id: string; name: string; email: string };

type UserPick = { id: string; name: string; email: string; phone: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function fmtTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short" }).format(d);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={null}>
      <AdminMessagesPageInner />
    </Suspense>
  );
}

function AdminMessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeUserId = searchParams.get("userId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convSearch,  setConvSearch]  = useState("");

  const [thread, setThread]             = useState<ThreadMessage[]>([]);
  const [threadUser, setThreadUser]     = useState<ThreadUser | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError]   = useState("");

  const [composer, setComposer] = useState("");
  const [sending, setSending]   = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserPick[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ── Load conversations
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const params = new URLSearchParams(convSearch ? { q: convSearch } : {});
      const res  = await fetch(`/api/admin/messages?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch { /* ignore */ }
    finally { setConvLoading(false); }
  }, [convSearch]);

  // ── Load thread for active user
  const loadThread = useCallback(async (userId: string) => {
    setThreadLoading(true);
    setThreadError("");
    try {
      const res  = await fetch(`/api/admin/messages/${userId}`, { headers: authHeader() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to load conversation.");
      setThread(data.messages);
      setThreadUser(data.user);
    } catch (e) {
      setThread([]);
      setThreadUser(null);
      setThreadError(e instanceof Error ? e.message : "Failed to load conversation.");
    } finally {
      setThreadLoading(false);
    }
  }, []);

  // ── Auth + initial load
  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
  }, [router]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadConversations(), convSearch ? 250 : 0);
    return () => clearTimeout(t);
  }, [convSearch, loadConversations]);

  useEffect(() => {
    if (activeUserId) loadThread(activeUserId);
    else { setThread([]); setThreadUser(null); }
  }, [activeUserId, loadThread]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  // ── Send admin reply
  async function send() {
    if (!activeUserId || !composer.trim()) return;
    setSending(composer);
    try {
      const res  = await fetch(`/api/admin/messages/${activeUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ body: composer.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to send.");
      setThread((t) => [...t, data.message]);
      setComposer("");
      loadConversations();
    } catch (e) {
      setThreadError(e instanceof Error ? e.message : "Failed to send.");
    } finally {
      setSending("");
    }
  }

  function selectConversation(userId: string) {
    router.push(`/admin/messages?userId=${userId}`);
  }

  // ── User picker
  async function openPicker() {
    setPickerOpen(true);
    if (allUsers.length === 0) {
      setPickerLoading(true);
      try {
        const res  = await fetch(`/api/admin/users`, { headers: authHeader() });
        const data = await res.json();
        if (data.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAllUsers(data.users.map((u: any) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone })));
        }
      } catch { /* ignore */ }
      finally { setPickerLoading(false); }
    }
  }

  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const filtered = q
      ? allUsers.filter((u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
        )
      : allUsers;
    return filtered.slice(0, 50);
  }, [allUsers, pickerQuery]);

  function pickUser(u: UserPick) {
    setPickerOpen(false);
    setPickerQuery("");
    router.push(`/admin/messages?userId=${u.id}`);
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-7rem)] sm:h-[calc(100vh-9rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-[1.3rem] font-extrabold text-white tracking-tight">Messages</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Conversations with platform users.</p>
        </div>
        <button
          onClick={openPicker}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr]">

        {/* ─── Conversations list ─── */}
        <aside className={`flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 min-h-0 ${activeUserId ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3 border-b border-slate-800 flex-shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[13px] text-slate-500">{convSearch ? "No conversations match." : "No conversations yet."}</p>
                <button onClick={openPicker} className="mt-3 text-[12px] text-blue-400 hover:text-blue-300 font-semibold">Start a new one →</button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800">
                {conversations.map((c) => {
                  const isActive = c.userId === activeUserId;
                  return (
                    <li key={c.userId}>
                      <button
                        onClick={() => selectConversation(c.userId)}
                        className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors ${isActive ? "bg-blue-500/10" : "hover:bg-slate-800/40"}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                          {initials(c.userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[13px] truncate ${c.unread > 0 ? "font-bold text-white" : "font-semibold text-slate-200"}`}>{c.userName}</p>
                            <p className="text-[10px] text-slate-500 flex-shrink-0">{fmtTimeAgo(c.lastAt)}</p>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={`text-[12px] truncate ${c.unread > 0 ? "text-slate-200" : "text-slate-500"}`}>
                              {c.lastFromAdmin && <span className="text-slate-600">You: </span>}
                              {c.lastBody}
                            </p>
                            {c.unread > 0 && (
                              <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 flex-shrink-0">
                                {c.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ─── Thread ─── */}
        <section className={`flex flex-col min-h-0 ${activeUserId ? "flex" : "hidden lg:flex"}`}>
          {!activeUserId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-[14px] font-semibold text-slate-400">Select a conversation</p>
                <p className="text-[12px] text-slate-500 mt-1">Or start a new one with any user.</p>
              </div>
            </div>
          ) : threadLoading && !threadUser ? (
            <div className="flex-1 p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-800 flex-shrink-0">
                <button
                  onClick={() => router.push("/admin/messages")}
                  className="lg:hidden w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center flex-shrink-0"
                  aria-label="Back to conversations"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {threadUser ? initials(threadUser.name) : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-white truncate">{threadUser?.name ?? "User"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{threadUser?.email}</p>
                </div>
                {threadUser && (
                  <Link
                    href={`/admin/users/${threadUser.id}`}
                    className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold whitespace-nowrap"
                  >
                    View profile
                  </Link>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
                {threadError && (
                  <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{threadError}</p>
                )}
                {thread.length === 0 && !threadLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[13px] text-slate-500">No messages yet. Send the first one below.</p>
                  </div>
                ) : (
                  thread.map((m) => (
                    <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        m.fromAdmin
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-100 rounded-bl-sm"
                      }`}>
                        <p className="text-[13px] whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-1 ${m.fromAdmin ? "text-blue-100/80" : "text-slate-500"}`}>
                          {m.createdAtFormatted}
                          {m.fromAdmin && m.readAt && <span className="ml-1.5">· Read</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-3 sm:p-4 border-t border-slate-800 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Type a message…  (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    maxLength={2000}
                    className="flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={send}
                    disabled={!composer.trim() || !!sending}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5 text-right">{composer.length}/2000</p>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ─── New conversation picker ─── */}
      <AnimatePresence>
        {pickerOpen && (
          <>
            <motion.div
              key="picker-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPickerOpen(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              key="picker"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 sm:inset-auto sm:top-[10vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md sm:h-[600px] sm:max-h-[80vh] bg-slate-900 sm:border sm:border-slate-800 sm:rounded-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
                <div>
                  <h3 className="text-[15px] font-bold text-white">New conversation</h3>
                  <p className="text-[12px] text-slate-500">Pick a user to message</p>
                </div>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-3 border-b border-slate-800 flex-shrink-0">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Search by name, email, phone…"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {pickerLoading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />)}
                  </div>
                ) : pickerResults.length === 0 ? (
                  <p className="p-8 text-center text-[13px] text-slate-500">{pickerQuery ? "No users match." : "No users."}</p>
                ) : (
                  <ul className="divide-y divide-slate-800">
                    {pickerResults.map((u) => (
                      <li key={u.id}>
                        <button
                          onClick={() => pickUser(u)}
                          className="w-full text-left p-3 hover:bg-slate-800/60 transition-colors flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {initials(u.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
