"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const sidebarW = collapsed ? 72 : 240;

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUnreadMessages(d.unreadMessages ?? 0); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        unreadMessages={unreadMessages}
      />

      {/*
        On mobile: no left margin (sidebar is a drawer overlay).
        On desktop: margin-left matches sidebar width, animated via inline style + CSS transition.
      */}
      <div
        className="min-h-screen flex flex-col transition-[margin-left] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: `var(--sidebar-w, 0px)` }}
      >
        {/* CSS custom property updated at the lg breakpoint via a style tag trick — simpler: just use inline style with a clamp */}
        <style>{`
          @media (min-width: 1024px) {
            :root { --sidebar-w: ${sidebarW}px; }
          }
          @media (max-width: 1023px) {
            :root { --sidebar-w: 0px; }
          }
        `}</style>

        <Topbar
          onMenuOpen={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          unreadMessages={unreadMessages}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
