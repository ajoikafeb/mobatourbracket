"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Swords,
  Calendar,
  Radio,
  Menu,
  X,
  Shield,
  Home,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bracket", label: "Bracket", icon: Swords },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/current-match", label: "Live", icon: Radio },
  { href: "/events", label: "Events", icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090B]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#09090B]/60"
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" style={{ minHeight: "68px" }}>
          {/* Logo */}
          <Link
            href="/"
            className="relative flex items-center py-2 flex-shrink-0 transition-all duration-300 hover:scale-105 group"
          >
            <div className="absolute -inset-2 rounded-xl bg-orange-500/0 group-hover:bg-orange-500/[0.06] transition-all duration-300" />
            <Image
              src="/logo.png"
              alt="Neosoul"
              width={902}
              height={322}
              className="relative h-10 md:h-[46px] lg:h-[52px] w-auto max-w-[min(52vw,220px)] sm:max-w-[280px] object-contain object-left"
              priority
              quality={100}
              sizes="(max-width: 767px) min(52vw, 220px), 280px"
            />
          </Link>

          {/* Desktop nav - centered */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-orange-400"
                      : "text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="relative z-10">{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-orange-500/[0.12] border border-orange-500/20 shadow-[0_0_12px_rgba(255,122,0,0.08)]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06]">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>

            <button
              className="md:hidden text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[68px] z-50 border-b border-white/[0.06] bg-[#09090B]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="mx-auto max-w-7xl px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-orange-500/[0.12] text-orange-400 border border-orange-500/20"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
