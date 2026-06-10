"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/trade": "Trade Giftcard",
  "/dashboard/recover": "Recover Code",
  "/dashboard/consignment": "Consignment",
  "/dashboard/editing": "Editing",
  "/dashboard/lipsync": "Lipsync Video",
  "/dashboard/messages": "Messages",
  "/dashboard/payment-history": "Payment History",
  "/dashboard/settings": "Settings",
};

interface TopbarProps {
  onMenuOpen: () => void;
  sidebarCollapsed: boolean;
  unreadMessages?: number;
}

export default function Topbar({ onMenuOpen, unreadMessages = 0 }: TopbarProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";
  const { initials, loading } = useUser();

  return (
    <header className="h-[64px] flex items-center gap-4 px-4 sm:px-6 bg-white border-b border-slate-100 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-600 flex-shrink-0"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-bold text-slate-900 truncate">{title}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Messages */}
        <Link
          href="/dashboard/messages"
          className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700"
          aria-label="Messages"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white leading-none">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link href="/dashboard/settings" className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 hover:opacity-90 transition-opacity">
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}
