"use client";

import Image from "next/image";
import { useSettings } from "@/hooks/use-settings";

export function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="relative border-t border-white/[0.05] bg-[#09090B]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Neosoul Logo"
              width={36}
              height={36}
              className="h-8 w-8 rounded-lg object-contain opacity-80"
            />
            <span className="text-base font-semibold text-zinc-300">
              {settings?.tournament_name || "Neosoul"}
            </span>
          </div>
          <p className="max-w-md text-sm text-zinc-600 leading-relaxed">
            {settings?.footer_text ||
              "Indonesian Community Tournament Tracker. Built for the community, by the community."}
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-700">
            <span>© 2026 Neosoul Indonesia</span>
            <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
