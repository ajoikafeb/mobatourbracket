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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bracket", label: "Bracket", icon: Swords },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/current-match", label: "Live", icon: Radio },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#09090B]/80 backdrop-blur-2xl"
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" style={{ height: "auto", minHeight: "64px" }}>
          <Link
            href="/"
            className="flex items-center py-2 pr-4 flex-shrink-0 transition-transform duration-200 hover:scale-105 hover:drop-shadow-[0_0_12px_rgba(249,115,22,0.45)]"
          >
            <Image
              src="/logo.png"
              alt="Neosoul"
              width={902}
              height={322}
              className="h-8 md:h-9 w-auto max-w-[min(52vw,220px)] sm:max-w-[280px] object-contain object-left transition-opacity group-hover:opacity-90"
              priority
              quality={100}
              sizes="(max-width: 767px) min(52vw, 220px), 280px"
            />
          </Link>

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
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
                    "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-orange-400"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-orange-500/10 border border-orange-500/20"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>

            <button
              className="md:hidden text-zinc-400 hover:text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-50 border-b border-white/[0.08] bg-[#09090B]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
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
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
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
