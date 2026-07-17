"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LayoutDashboard,
  Swords,
  Calendar,
  Radio,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Loader2,
  Wand2,
  Sparkles,
  Download,
  CalendarDays,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SidebarItem =
  | { type: "link"; href: string; label: string; icon: typeof LayoutDashboard; highlight?: boolean }
  | { type: "divider" };

const sidebarLinks: SidebarItem[] = [
  { type: "link", href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { type: "link", href: "/admin/events", label: "Events", icon: CalendarDays },
  { type: "link", href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { type: "link", href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { type: "divider" },
  { type: "link", href: "/admin/tournament-generator", label: "Tournament Generator", icon: Wand2, highlight: true },
  { type: "link", href: "/admin/schedule-generator", label: "Schedule Generator", icon: Sparkles },
  { type: "link", href: "/admin/bracket", label: "Bracket Editor", icon: Swords },
  { type: "link", href: "/admin/schedule", label: "Schedule Editor", icon: Calendar },
  { type: "link", href: "/admin/current-match", label: "Current Match", icon: Radio },
  { type: "link", href: "/admin/export", label: "Export Data", icon: Download },
  { type: "divider" },
  { type: "link", href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthChecked(true);
      return;
    }

    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/admin/login");
        return;
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, [pathname, router, supabase]);

  if (pathname === "/admin/login") {
    return children;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function renderLinks() {
    return sidebarLinks.map((item, idx) => {
      if (item.type === "divider") {
        return (
          <div key={`divider-${idx}`} className="my-2 border-t border-white/[0.06]" />
        );
      }
      const isActive = pathname === item.href;
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
            isActive
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
              : item.highlight
              ? "text-orange-300/70 hover:text-orange-300 hover:bg-orange-500/5"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r border-white/[0.08] bg-[#09090B]">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/[0.08]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden">
            <Image src="/logo.png" alt="Neosoul" width={32} height={32} className="h-8 w-8 object-contain" />
          </div>
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {renderLinks()}
        </nav>

        <div className="p-4 border-t border-white/[0.08] space-y-1">
          <span className="block px-4 pb-2 text-[11px] text-zinc-600 font-medium">v0.0.2</span>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-white/[0.08] bg-[#09090B]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-zinc-400 hover:text-white p-2"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Neosoul" width={20} height={20} className="h-5 w-5 rounded object-contain" />
              <span className="text-sm font-bold text-white">Admin</span>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            View Site
          </Link>
        </header>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:hidden fixed inset-0 z-50 bg-[#09090B]/95 backdrop-blur-xl"
            >
              <div className="flex flex-col h-full pt-16 pb-6 px-4">
                <nav className="flex-1 space-y-1 overflow-y-auto">
                  {sidebarLinks.map((item, idx) => {
                    if (item.type === "divider") {
                      return (
                        <div key={`divider-${idx}`} className="my-2 border-t border-white/[0.06]" />
                      );
                    }
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : item.highlight
                            ? "text-orange-300/70 hover:text-orange-300 hover:bg-orange-500/5"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="space-y-1">
                  <span className="block px-4 pb-2 text-[11px] text-zinc-600 font-medium">v0.0.2</span>
                  <Link
                    href="/"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Site
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
