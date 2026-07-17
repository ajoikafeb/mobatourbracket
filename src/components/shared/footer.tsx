"use client";

import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/hooks/use-settings";
import { MessageCircle, Globe, Tv, ExternalLink } from "lucide-react";
import type { Settings } from "@/lib/types";

export function Footer({ settings: externalSettings }: { settings?: Settings | null }) {
  const { settings: hookSettings } = useSettings();
  const settings = externalSettings ?? hookSettings;

  const socialLinks = [
    { url: settings?.discord_url, label: "Discord", icon: MessageCircle },
    { url: settings?.kick_url, label: "Kick", icon: Tv },
    { url: settings?.instagram_url, label: "Instagram", icon: ExternalLink },
    { url: settings?.website_url, label: "Website", icon: Globe },
  ].filter((l) => l.url && l.url.trim() !== "");

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
              {settings?.community_name || settings?.tournament_name || "Neosoul"}
            </span>
          </div>
          <p className="max-w-md text-sm text-zinc-600 leading-relaxed">
            {settings?.footer_text ||
              "Indonesian Community Tournament Tracker. Built for the community, by the community."}
          </p>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-orange-400 hover:border-orange-500/20 hover:bg-orange-500/5 transition-all"
                    title={link.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-zinc-700">
            <span>&copy; {new Date().getFullYear()} {settings?.community_name || "Neosoul Indonesia"}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
            <span>{settings?.version || "v0.0.2"}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
