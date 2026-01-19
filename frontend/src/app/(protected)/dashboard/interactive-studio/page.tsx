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
    ZoomOut
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";


export default function InteractiveStudioPage() {
  const searchParams = useSearchParams();
  const questionId = searchParams.get("questionId");
  const [question, setQuestion] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleVersion = (index: number) => {
    setExpandedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
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
        const qData = await qRes.json();
        if (!qRes.ok) throw new Error(qData.detail || "Failed to load question");

        // Fetch Versions/History
        const vRes = await fetch(
          `${config.apiBaseUrl}/api/questions/${questionId}/versions`,
          { credentials: "include" }
        );
        const vData = await vRes.json();
        
        // Map versions to messages and construct version stack
        const sortedVersions = (vData || []).sort((a: any, b: any) => a.version - b.version);
        const historyMessages: { role: "user" | "assistant", content: string }[] = [];
        
        const allVersions = [];
        
        // Add Base Question as Version 0 (or version 1 if no history exists yet)
        allVersions.push({
          id: qData.id,
          type: qData.question_type === "mcq" ? "MULTIPLE CHOICE" : "OPEN ENDED",
          question_text: qData.question_text,
          options: qData.options || null,
          correct_answer: qData.correct_answer || null,
          explanation: qData.explanation || "",
          versionLabel: "INITIAL VERSION",
          versionNum: 0,
          subject: qData.subject || "QUESTION",
          topic: qData.topic || "STUDIO",
        });

        sortedVersions.forEach((v: any) => {
          if (v.instruction && v.instruction !== "__seed__") {
            historyMessages.push({ role: "user", content: v.instruction });
            historyMessages.push({ role: "assistant", content: "I've updated the question based on your instructions." });
          }
          
          const newQ = v.content;
          allVersions.push({
            id: v.question_id,
            type: newQ.question_type === "mcq" ? "MULTIPLE CHOICE" : "OPEN ENDED",
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

  const handleRefine = async () => {
    if (!instruction.trim() || isRefining || !questionId) return;

    const currentInstruction = instruction;
    setInstruction("");
    setMessages(prev => [...prev, { role: "user", content: currentInstruction }]);
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

      const newQuestion = data.question;
      const updatedQ = {
        id: data.question_id,
        type: newQuestion.question_type === "mcq" ? "MULTIPLE CHOICE" : "OPEN ENDED",
        question_text: newQuestion.question_text,
        options: newQuestion.options || null,
        correct_answer: newQuestion.correct_answer || null,
        explanation: newQuestion.explanation || "",
        versionLabel: `REFINEMENT V${data.version}.0`,
        versionNum: data.version,
        subject: newQuestion.subject || "QUESTION",
        topic: newQuestion.topic || "STUDIO",
      };

      setVersions(prev => {
        const newVersions = [...prev, updatedQ];
        // Automatically hide previous versions and show the new one
        setExpandedIndices([newVersions.length - 1]);
        return newVersions;
      });
      setQuestion(updatedQ);

      setMessages(prev => [...prev, { role: "assistant", content: "I've updated the question based on your instructions." }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Refinement failed";
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${message}` }]);
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
            Please select a question from your PDF Workspace to start refining
            it in the studio.
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
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Go to Workspace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-81px)] no-scrollbar flex-col bg-white text-gray-900 font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden no-scrollbar">
        <div className="w-full md:w-[300px] h-[40vh] md:h-full border-t md:border-t-0 md:border-r flex flex-col bg-white shrink-0 order-2 md:order-1">
          <div className="p-4 border-b flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
              Chat
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                  {msg.role === "user" ? "YOU" : "ASSISTANT"}
                </label>
                <div className={`p-5 rounded-sm text-xs leading-relaxed border ${
                  msg.role === "user" 
                  ? "bg-white border-gray-100 text-gray-800" 
                  : "bg-gray-50 border-gray-100 text-gray-600"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t space-y-4">
            <div className="relative">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isRefining}
                placeholder="Type a command (e.g., 'Add a solution explanation' or 'Simplify wording')..."
                className="w-full min-h-[100px] max-h-[300px] p-5 text-xs bg-gray-50/30 border border-gray-100 rounded-sm resize-none focus:outline-none focus:ring-0 focus:border-gray-300 placeholder:text-gray-400 italic leading-relaxed"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                <Send 
                  className={`h-4 w-4 cursor-pointer transition-colors ${isRefining ? "text-gray-300" : "text-gray-900"}`} 
                  onClick={handleRefine}
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isRefining ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  {isRefining ? "WORKING..." : "READY"}
                </span>
              </div>
              <button 
                onClick={() => setMessages([])}
                className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
              >
                CLEAR HISTORY
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#FDFDFD] relative overflow-y-auto no-scrollbar order-1 md:order-2">
          <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-8">
            <div className="flex items-center gap-6">
            
              <Badge
                variant="secondary"
                className="bg-gray-900 text-white rounded-sm text-[10px] font-black h-5 px-2 tracking-tighter"
              >
                {question?.versionNum !== undefined ? `V${question.versionNum}.0` : "V0.0"}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 gap-2 hover:text-gray-900 hover:bg-transparent"
              >
                <HistoryIcon className="h-4 w-4" />
                Version History
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-900 rounded-sm text-[10px] font-black uppercase tracking-widest px-4 h-9 gap-2 hover:bg-gray-900 hover:text-white transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                EXPORT
              </Button>
            </div>
          </div>

          <div className="p-16 flex flex-col items-center gap-4 min-h-[calc(100%-56px)]">
            {versions.map((v, vIdx) => {
              return (
                <div key={`version-${v.id}-${vIdx}`} className="w-full max-w-2xl relative">
                  <div className="mb-4 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase rounded-none px-3 py-1 border-gray-900 text-gray-900">
                      {v.versionLabel}
                    </Badge>
                  </div>
                  <QuestionCard closeInteractiveBtn={true} q={v} index={vIdx} />
                  
                  {/* Internal Card Zoom Controls (Latest version only) */}
                  {vIdx === versions.length - 1 && (
                    <div className="absolute bottom-8 right-[-60px] flex flex-col gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="bg-white shadow-sm border-gray-200 h-10 w-10 hover:bg-gray-50 transition-colors rounded-sm"
                      >
                        <ZoomIn className="h-4 w-4 text-gray-900" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="bg-white shadow-sm border-gray-200 h-10 w-10 hover:bg-gray-50 transition-colors rounded-sm"
                      >
                        <ZoomOut className="h-4 w-4 text-gray-900" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="bg-white shadow-sm border-gray-200 h-10 w-10 hover:bg-gray-50 transition-colors rounded-sm"
                      >
                        <Maximize2 className="h-4 w-4 text-gray-900" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
