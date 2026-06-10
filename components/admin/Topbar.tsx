"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orders":    "Pending Orders",
  "/admin/users":     "Users",
  "/admin/messages":  "Messages",
  "/admin/settings":  "Settings",
  "/admin/fund-user": "Fund User",
};

interface AdminTopbarProps {
  onMenuOpen: () => void;
  unreadCount?: number;
}

export default function AdminTopbar({ onMenuOpen, unreadCount = 0 }: AdminTopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <header className="h-[64px] flex items-center gap-4 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-bold text-white truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/admin/messages"
          className="relative w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
          aria-label="Messages"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-900 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Admin avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
          A
        </div>
      </div>
    </header>
  );
}
