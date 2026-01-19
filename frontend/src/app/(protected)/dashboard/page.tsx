"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon, FileUp, Layers, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Question,
  QuestionTypeMapping,
  RecentQuestion,
  SourceTypeMapping,
} from "@/types/question";
import { config } from "@/lib/config";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialize = useAuthStore((state) => state.initialize);
  const router = useRouter();
  const [questions, setQuestions] = useState<RecentQuestion[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const fetchQuestions = async () => {
      setQuestionLoading(true);
      setError(null);
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/questions/recent`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(data.detail || "Failed to load questions");
        }
        if (!Array.isArray(data)) {
          setQuestions([]);
          return;
        }
        setQuestions(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
      } finally {
        setQuestionLoading(false);
      }
    };

    fetchQuestions();
  }, [user]);
  console.log(questions);
  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col bg-white mx-auto justify-center items-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.user_metadata?.display_name || user.email;

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {displayName}!
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/pdf-workspace">
            <Card className="relative group cursor-pointer rounded-2xl rounded-md justify-center flex border-gray-200 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:border-indigo-700">
              <CardHeader className="flex flex-col items-center gap-1 justify-center w-full text-center">
                <FileUp className="h-10 w-10 text-gray-400 group-hover:text-indigo-700" />
                <CardTitle className="text-base text-gray-900 mt-2 uppercase">
                  PDF Workspace
                </CardTitle>
                <CardDescription className="mt-1 text-xs text-gray-600">
                  Import PDFs or DOCX to analyze core concepts and generate
                  structured question sets.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/similar-questions">
            <Card className=" relative group cursor-pointer rounded-2xl rounded-md justify-center flex border-gray-200 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:border-indigo-700">
              <CardHeader className="flex flex-col items-center gap-1 justify-center w-full text-center">
                <CopyIcon className="h-10 w-10 text-gray-400 group-hover:text-indigo-700" />
                <CardTitle className="text-base text-gray-900 mt-2 uppercase">
                  Similar Questions
                </CardTitle>
                <CardDescription className="mt-1 text-xs text-gray-600">
                  Paste existing text or scan images to create isomorphic
                  variations of established items.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Card className=" relative group cursor-pointer rounded-2xl  rounded-md justify-center flex border-gray-200 shadow-sm transition hover:border-indigo-700 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-col items-center gap-1 justify-center w-full text-center">
              <Sparkles className="h-8 w-8 text-gray-400 group-hover:text-indigo-700" />
              <CardTitle className="text-base text-gray-900 mt-2 uppercase">
                Interactive Studio
              </CardTitle>
              <CardDescription className="mt-1 text-xs text-gray-600">
                Real-time collaborative generation using natural language
                prompts and AI refinement.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-10 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Recent Questions
          </h3>
          {questionLoading && (
            <p className="mt-3 text-sm text-gray-500">Loading questions...</p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {!questionLoading && !error && questions.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">
              No questions yet. Generate some in the PDF workspace or Similar
              question workspace.
            </p>
          )}
          {!questionLoading && !error && questions.length > 0 && (
            <div className="mt-4 space-y-3">
              {questions.slice(0, 5).map((q, index) => (
                <div
                  key={q.session_id}
                  className="flex items-center justify-between rounded-md border border-gray-100 px-4 py-3"
                >
                  <div className="flex flex-col gap-2">
                    <p className="uppercase font-bold">Session {index + 1} </p>

                    <div className="flex gap-2 h-5">
                      <Badge className="bg-white text-xs border border-indigo-700 text-indigo-700 rounded-none">
                        {QuestionTypeMapping[q.question_type]}
                      </Badge>
                      <Badge className="bg-white border border-indigo-700 text-indigo-700 rounded-none">
                        {q.quantity} Question
                      </Badge>
                      <Badge className="bg-white text-xs border border-indigo-700 text-indigo-700 rounded-none">
                        {SourceTypeMapping[q.source_type]}
                      </Badge>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/questions?session_id=${q.session_id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Open Session
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
