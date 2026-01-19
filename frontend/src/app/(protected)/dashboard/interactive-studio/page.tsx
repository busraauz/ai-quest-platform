"use client";

import { Loading } from "@/components/Loading";
import { QuestionCard } from "@/components/QuestionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { config } from "@/lib/config";
import {
  Download,
  History as HistoryIcon,
  Maximize2,
  MessageSquare,
  Send,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type QuestionPayload = {
  question_type: "mcq" | "open" | "open_ended";
  question_text: string;
  options: Record<string, string> | null;
  correct_answer: string | null;
  explanation: string;
  subject?: string | null;
  topic?: string | null;
};

type QuestionVersion = QuestionPayload & {
  id: string;
  versionLabel: string;
  versionNum: number;
  subject: string;
  topic: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type QuestionBaseResponse = QuestionPayload & {
  id: string | number;
  detail?: string;
};

type QuestionVersionResponse = {
  question_id: string | number;
  version: number;
  instruction?: string | null;
  content: QuestionPayload;
};

export default function InteractiveStudioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const questionId = searchParams.get("questionId");
  const [question, setQuestion] = useState<QuestionVersion | null>(null);
  const [versions, setVersions] = useState<QuestionVersion[]>([]);
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToLatestVersion = () => {
    canvasEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (versions.length > 0) {
      scrollToLatestVersion();
    }
  }, [versions]);

  const toggleVersion = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    if (!questionId) {
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Question Base
        const qRes = await fetch(
          `${config.apiBaseUrl}/api/questions/${questionId}`,
          { credentials: "include" }
        );
        const qData = (await qRes.json()) as QuestionBaseResponse;
        if (!qRes.ok) throw new Error(qData.detail || "Failed to load question");

        // Fetch Versions/History
        const vRes = await fetch(
          `${config.apiBaseUrl}/api/questions/${questionId}/versions`,
          { credentials: "include" }
        );
        const vData = (await vRes.json()) as QuestionVersionResponse[];

        // Map versions to messages and construct version stack
        const sortedVersions = (vData || []).sort(
          (a, b) => a.version - b.version
        );
        const historyMessages: ChatMessage[] = [];

        const allVersions: QuestionVersion[] = [];

        // Add Base Question as Version 0 (or version 1 if no history exists yet)
        allVersions.push({
          id: String(qData.id),
          question_type: qData.question_type,
          question_text: qData.question_text,
          options: qData.options || null,
          correct_answer: qData.correct_answer || null,
          explanation: qData.explanation || "",
          versionLabel: "INITIAL VERSION",
          versionNum: 0,
          subject: qData.subject || "QUESTION",
          topic: qData.topic || "STUDIO",
        });

        sortedVersions.forEach((v) => {
          if (v.instruction && v.instruction !== "__seed__") {
            historyMessages.push({ role: "user", content: v.instruction });
            historyMessages.push({
              role: "assistant",
              content: "I've updated the question based on your instructions.",
            });
          }

          const newQ = v.content;
          allVersions.push({
            id: String(v.question_id),
            question_type: newQ.question_type,
            question_text: newQ.question_text,
            options: newQ.options || null,
            correct_answer: newQ.correct_answer || null,
            explanation: newQ.explanation || "",
            versionLabel: `REFINEMENT V${v.version}.0`,
            versionNum: v.version,
            subject: newQ.subject || "QUESTION",
            topic: newQ.topic || "STUDIO",
          });
        });

        setMessages(historyMessages);
        setVersions(allVersions);
        setExpandedIndices([allVersions.length - 1]);
        setQuestion(allVersions[allVersions.length - 1]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionId]);

  const handleRefine = async (overrideInstruction?: string) => {
    const finalInstruction = overrideInstruction || instruction;
    if (!finalInstruction.trim() || isRefining || !questionId) return;

    const currentInstruction = finalInstruction;
    if (!overrideInstruction) setInstruction("");
    setMessages((prev) => [...prev, { role: "user", content: currentInstruction }]);
    setIsRefining(true);

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/refine/${questionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instruction: currentInstruction }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Refinement failed");

      const newQuestion = data.question as QuestionPayload;
      const updatedQ: QuestionVersion = {
        id: String(data.question_id),
        question_type: newQuestion.question_type,
        question_text: newQuestion.question_text,
        options: newQuestion.options || null,
        correct_answer: newQuestion.correct_answer || null,
        explanation: newQuestion.explanation || "",
        versionLabel: `REFINEMENT V${data.version}.0`,
        versionNum: data.version,
        subject: newQuestion.subject || "QUESTION",
        topic: newQuestion.topic || "STUDIO",
      };

      setVersions((prev) => {
        const newVersions = [...prev, updatedQ];
        // Automatically hide previous versions and show the new one
        setExpandedIndices([newVersions.length - 1]);
        return newVersions;
      });
      setQuestion(updatedQ);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I've updated the question based on your instructions.",
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Refinement failed";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${message}` },
      ]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRefine();
    }
  };

  if (!questionId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
        <Card className="max-w-md text-center p-10 border-dashed border-2">
          <h2 className="text-xl font-bold mb-2">No Question Selected</h2>
          <p className="text-gray-500 mb-6">
            Please select a question from your PDF Workspace to start refining it
            in the studio.
          </p>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Go to Workspace
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <Loading fullScreen message="Entering Studio..." size="lg" />;
  }

  if (error || !question) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
        <Card className="max-w-md text-center p-10 border-dashed border-2">
          <h2 className="text-xl font-bold mb-2">Couldn’t load question</h2>
          <p className="text-gray-500 mb-6">{error || "Unknown error"}</p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => router.push("/dashboard/pdf-workspace")}
          >
            Go to Workspace
          </Button>
        </Card>
      </div>
    );
  }

  const latestVersion = versions[versions.length - 1];

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar: Question Info & Quick Actions */}
      <div className="w-80 border-r bg-white flex flex-col hidden lg:flex">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <HistoryIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Interactive Studio</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">History & Controls</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm py-2 px-1">
              <span className="text-gray-500">Document</span>
              <span className="font-medium text-gray-900 truncate max-w-[120px]">{question.subject}</span>
            </div>
            <div className="flex justify-between text-sm py-2 px-1">
              <span className="text-gray-500">Current Version</span>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                {question.versionLabel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Make it harder", icon: "🔥", prompt: "Make this question significantly harder and more challenging." },
                { label: "Simplify wording", icon: "✨", prompt: "Simplify the wording of this question to make it clearer." },
                { label: "Add an option", icon: "➕", prompt: "Add one more plausible incorrect option (E) to the MCQ." },
                { label: "Fix grammar", icon: "✍️", prompt: "Check and fix any grammatical errors in the question and explanation." },
                { label: "Add real-world case", icon: "🌍", prompt: "Re-contextualize this question within a real-world scenario." },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start h-9 text-left font-normal border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 group"
                  onClick={() => {
                    setInstruction(action.prompt);
                    handleRefine(action.prompt);
                  }}
                >
                  <span className="mr-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Version History</h3>
            <div className="space-y-2">
              {[...versions].reverse().map((v, i) => (
                <div
                  key={v.versionNum}
                  onClick={() => toggleVersion(versions.length - 1 - i)}
                  className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                    expandedIndices.includes(versions.length - 1 - i)
                      ? "border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-200"
                      : "border-gray-100 hover:border-gray-200 bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{v.versionLabel}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{v.topic.toLowerCase()}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{v.question_text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas: Question Stack */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <div className="h-16 border-b bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-900">Workspace Canvas</h2>
            <div className="flex h-6 items-center space-x-4 text-sm">
              <div className="flex items-center text-gray-400">
                <ZoomIn className="h-4 w-4 mr-1" />
                <span>100%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-12 pb-24">
            {versions.map((v, i) => (
              <div
                key={`${v.id}-${v.versionNum}`}
                className={`transition-all duration-500 ${
                  expandedIndices.includes(i) ? "opacity-100 scale-100" : "opacity-30 scale-[0.98] blur-[1px]"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <Badge
                    variant={i === versions.length - 1 ? "default" : "outline"}
                    className={i === versions.length - 1 ? "bg-indigo-600" : "bg-white text-gray-400 border-gray-200"}
                  >
                    {v.versionLabel}
                  </Badge>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                
                {i === versions.length - 1 ? (
                  <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-xl p-8 space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Question Text</label>
                      <textarea
                        className="w-full text-xl font-medium text-gray-900 border-none focus:ring-0 p-0 bg-transparent resize-none min-h-[100px]"
                        value={v.question_text}
                        readOnly // We'll make it editable once we have a Save API
                        placeholder="Enter question text..."
                      />
                    </div>

                    {v.options && (
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Options</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(v.options).map(([k, val]) => (
                            <div
                              key={k}
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                k === v.correct_answer
                                  ? "border-emerald-500 bg-emerald-50/50"
                                  : "border-gray-100 bg-gray-50/30"
                              }`}
                            >
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                k === v.correct_answer ? "bg-emerald-500 text-white" : "bg-white border text-gray-400"
                              }`}>
                                {k}
                              </div>
                              <input
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                                value={val}
                                readOnly
                              />
                              {k === v.correct_answer && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none">Correct</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Explanation</label>
                      <div className="bg-indigo-50/30 rounded-xl p-6 border border-indigo-100/50">
                        <textarea
                          className="w-full text-gray-600 text-sm leading-relaxed border-none focus:ring-0 p-0 bg-transparent resize-none min-h-[80px]"
                          value={v.explanation}
                          readOnly
                          placeholder="Explain why the answer is correct..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex gap-2">
                         <Badge variant="outline" className="bg-white">{v.subject}</Badge>
                         <Badge variant="outline" className="bg-white">{v.topic}</Badge>
                      </div>
                      <p className="text-[10px] text-gray-400 italic">Manual editing is currently disabled. Use the AI chat to refine.</p>
                    </div>
                  </div>
                ) : (
                  <QuestionCard q={v as any} index={i} closeInteractiveBtn={true} />
                )}
              </div>
            ))}
            <div ref={canvasEndRef} />
          </div>
        </div>
      </div>

      {/* Right Sidebar: Refinement Chat */}
      <div className="w-96 border-l bg-white flex flex-col">
        <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-sm">AI Refinement Chat</h3>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-400">
            {messages.length} Messages
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">How can I help improve this?</p>
                <p className="text-xs text-gray-500 mt-1">Try asking to rephrase, add context, or change the difficulty level.</p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-100 text-gray-800 rounded-bl-none border border-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {isRefining && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200 flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t">
          <div className="relative group">
            <textarea
              className="w-full min-h-[100px] max-h-48 resize-none rounded-xl border border-gray-200 p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 group-hover:bg-white"
              placeholder="Tell the AI how to refine the question..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              size="icon"
              className={`absolute bottom-3 right-3 h-8 w-8 rounded-lg transition-all ${
                instruction.trim() ? "bg-indigo-600 opacity-100" : "bg-gray-200 opacity-50 cursor-not-allowed"
              }`}
              onClick={() => handleRefine()}
              disabled={isRefining || !instruction.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
