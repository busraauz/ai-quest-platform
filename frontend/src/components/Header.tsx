"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import AuthButton from "./AuthButton";
import { usePathname } from "next/navigation";

export function Header() {
    const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full max-w-screen border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 w-full items-center justify-between px-4 md:px-8">
        <div className="flex items-center">
          <Link className="flex items-center space-x-2" href="/">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-xl sm:inline-block">
              QuestAI
            </span>
          </Link>
        </div>
        {pathname !== '/login' && pathname !== '/signup' && (
            <div className="flex items-center gap-4">
            <AuthButton />
            </div>
        )}
      </div>
    </header>
  );
}
