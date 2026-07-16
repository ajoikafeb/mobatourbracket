"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/shared/animated-background";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <Card className="p-12 sm:p-16 max-w-lg">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <h1 className="text-8xl sm:text-9xl font-black bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
              404
            </h1>
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-3">
            Page Not Found
          </h2>
          <p className="text-zinc-400 mb-8">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/">
              <Button>
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
