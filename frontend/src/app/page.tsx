"use client";
import { Features } from "@/components/landing/Features";
import { Header } from "@/components/Header";
import { Hero } from "@/components/landing/Hero";
import { useState } from "react";
export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white mx-auto justify-center items-center">
      <Hero />
      <Features />
    </div>
  );
}
