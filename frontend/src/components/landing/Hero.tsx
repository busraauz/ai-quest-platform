import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-24">
      <div className="container flex max-w-[64rem] flex-col items-center gap-8 text-center">
        
        <h1 className="font-heading text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-slate-900">
          Generate high-quality <br className="hidden md:block"/>
          questions in <br className="hidden md:block"/>
          seconds
        </h1>
        
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          The AI-powered platform designed specifically for everyone.
          Transform any content into professional assessment items instantly.
        </p>
        
        <div className="space-x-4 pt-4">
          <Link href="/signin">
            <Button size="lg" className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 h-12 text-base">Get Started for Free</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
