"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  unreadMessages?: number;
}

interface SidebarUserProps {
  initials: string;
  fullName: string;
  email: string;
  loading: boolean;
}

function buildNavItems(unreadMessages: number) { return [
  {
    label: "Dashboard",
    href: "/dashboard",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Trade Giftcard",
    href: "/dashboard/trade",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: "Recover Code",
    href: "/dashboard/recover",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Consignment",
    href: "/dashboard/consignment",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Editing",
    href: "/dashboard/editing",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    label: "Lipsync Video",
    href: "/dashboard/lipsync",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    badge: unreadMessages > 0 ? unreadMessages : null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Payment History",
    href: "/dashboard/payment-history",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]; }

const SidebarContent = ({
  collapsed,
  onToggleCollapse,
  pathname,
  onClose,
  isMobile,
  userProps,
  onLogout,
  unreadMessages,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  pathname: string;
  onClose: () => void;
  isMobile: boolean;
  userProps: SidebarUserProps;
  onLogout: () => void;
  unreadMessages: number;
}) => (
  <div className="flex flex-col h-full bg-slate-900 text-white">
    {/* Background accents */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-20%,rgba(59,130,246,0.15),transparent)] pointer-events-none" />

    {/* Logo + collapse toggle */}
    <div className={`relative z-10 flex items-center h-[64px] flex-shrink-0 border-b border-white/[0.06] px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
      {!collapsed && (
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={isMobile ? onClose : undefined}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/50">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight">BPoint</span>
        </Link>
      )}
      <button
        onClick={isMobile ? onClose : onToggleCollapse}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isMobile ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : collapsed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          </svg>
        )}
      </button>
    </div>

    {/* Nav items */}
    <nav className="relative z-10 flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Navigation
        </p>
      )}
      {buildNavItems(unreadMessages).map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={isMobile ? onClose : undefined}
            title={collapsed ? item.label : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 relative
              ${isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.07]"
              }
              ${collapsed ? "justify-center px-2" : ""}`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="flex-1 truncate">{item.label}</span>
            )}
            {!collapsed && item.badge ? (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">
                {item.badge}
              </span>
            ) : null}
            {collapsed && item.badge ? (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                {item.badge}
              </span>
            ) : null}
            {/* Tooltip on collapsed */}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-[12px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-white/10">
                {item.label}
                {item.badge ? ` (${item.badge})` : ""}
              </span>
            )}
          </Link>
        );
      })}
    </nav>

    {/* User profile at bottom */}
    <div className={`relative z-10 border-t border-white/[0.06] p-3 flex-shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
      <div className={`flex items-center gap-3 ${collapsed ? "" : "w-full"}`}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 flex-shrink-0">
          {userProps.loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            userProps.initials
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">
              {userProps.loading ? (
                <span className="inline-block w-24 h-3 bg-white/10 rounded animate-pulse" />
              ) : (
                userProps.fullName || "—"
              )}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {userProps.loading ? (
                <span className="inline-block w-32 h-2.5 bg-white/10 rounded animate-pulse mt-1" />
              ) : (
                userProps.email
              )}
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onLogout}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-slate-500 hover:text-white flex-shrink-0"
            title="Log out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  </div>
);

export default function Sidebar({ collapsed, mobileOpen, onClose, onToggleCollapse, unreadMessages = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarW = collapsed ? 72 : 240;
  const { user, loading, initials, fullName } = useUser();

  const userProps: SidebarUserProps = {
    initials,
    fullName,
    email: user?.email ?? "",
    loading,
  };

  function handleLogout() {
    sessionStorage.removeItem("access_token");
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:block fixed top-0 left-0 h-screen z-40 overflow-hidden flex-shrink-0"
        style={{ width: sidebarW }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          pathname={pathname}
          onClose={onClose}
          isMobile={false}
          userProps={userProps}
          onLogout={handleLogout}
          unreadMessages={unreadMessages}
        />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 h-screen w-[240px] z-50 lg:hidden overflow-hidden"
            >
              <SidebarContent
                collapsed={false}
                onToggleCollapse={onToggleCollapse}
                pathname={pathname}
                onClose={onClose}
                isMobile={true}
                userProps={userProps}
                onLogout={handleLogout}
                unreadMessages={unreadMessages}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
