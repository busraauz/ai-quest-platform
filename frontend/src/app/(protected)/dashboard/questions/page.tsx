"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, BrainCircuit } from "lucide-react";
import { config } from "@/lib/config";
import { QuestionCard } from "@/components/QuestionCard";
import { Loading } from "@/components/Loading";
import { GeneratedQuestion } from "@/types/document";
import { Separator } from "@/components/ui/separator";

function QuestionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/questions/session/${sessionId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load questions");
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Card className="max-w-md text-center p-10 border-dashed border-2">
          <h2 className="text-xl font-bold mb-2">No Session Selected</h2>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container max-w-screen-2xl mx-auto p-6 lg:p-10">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Generated Questions         
      </h2>        
      {loading && (
        <Loading message="Loading session questions..." />
      )}

        {error && (
          <Card className="max-w-md mx-auto text-center p-10 border-red-100 bg-red-50/10">
            <h2 className="text-lg font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 italic">No questions found for this session.</p>
          </div>
        )}

        {!loading && !error && questions.length > 0 && (
          <div className="flex flex-col gap-2">
            {questions.map((q, idx) => (
              <QuestionCard key={q.id} q={q} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<Loading fullScreen message="Loading questions..." size="lg" />}>
      <QuestionContent />
    </Suspense>
  );
}
