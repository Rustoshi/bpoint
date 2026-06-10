"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminTopbar from "@/components/admin/Topbar";

const NO_SHELL = ["/admin/login"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [depositCount, setDepositCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const showShell = !NO_SHELL.includes(pathname);

  useEffect(() => {
    if (!showShell) return;
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) return;
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPendingCount(d.stats.pendingOrders ?? 0);
          setDepositCount(d.stats.pendingDeposits ?? 0);
          setUnreadCount(d.stats.unreadMessages ?? 0);
        }
      })
      .catch(() => {});
  }, [showShell, pathname]);

  if (!showShell) {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pendingCount={pendingCount}
        depositCount={depositCount}
        unreadCount={unreadCount}
      />
      <div className="lg:ml-[240px] min-h-screen flex flex-col">
        <AdminTopbar onMenuOpen={() => setMobileOpen(true)} unreadCount={unreadCount} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
