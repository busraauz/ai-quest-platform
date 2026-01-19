import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Copy, BookOpen } from "lucide-react";

export function Features() {
  return (
    <section
      id="features"
      className="container space-y-12 py-8 md:py-12 lg:py-24"
    >
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl text-slate-900">
          Powerful Educator Tools
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Everything you need to build robust assessments from your existing materials.
        </p>
      </div>
      
      <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[70rem] md:grid-cols-3">
        {/* Feature 1 */}
        <div className="group relative overflow-hidden rounded-2xl border bg-white p-8 hover:border-indigo-100 transition-colors">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">PDF Workspace</h3>
            <p className="text-muted-foreground leading-relaxed">
              Upload textbooks, articles, or lecture notes. Our AI analyzes the hierarchy and extracts key concepts to build targeted quizzes.
            </p>
        </div>

        {/* Feature 2 */}
        <div className="group relative overflow-hidden rounded-2xl border bg-white p-8 hover:border-indigo-100 transition-colors">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Copy className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Question Cloning</h3>
            <p className="text-muted-foreground leading-relaxed">
              Paste a single question and generate five variations with similar difficulty levels. Perfect for preventing cheating in large classrooms.
            </p>
        </div>

        {/* Feature 3 */}
        <div className="group relative overflow-hidden rounded-2xl border bg-white p-8 hover:border-indigo-100 transition-colors">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Interactive Studio</h3>
            <p className="text-muted-foreground leading-relaxed">
              A collaborative editor where you can chat with the AI to refine distractors, adjust Bloom&apos;s Taxonomy levels, and add hints.
            </p>
        </div>
      </div>
    </section>
  );
}
