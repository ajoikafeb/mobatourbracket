"use client";

import { Trophy } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

export function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="border-t border-white/[0.08] bg-[#09090B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              {settings?.tournament_name || "Neosoul"}
            </span>
          </div>
          <p className="max-w-md text-sm text-zinc-500">
            {settings?.footer_text ||
              "Community Mobile MOBA Tournament Tracker. Built for the community, by the community."}
          </p>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <span>© 2026 Neosoul Indonesia</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
