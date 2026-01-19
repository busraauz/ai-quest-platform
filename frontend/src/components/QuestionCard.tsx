import { GeneratedQuestion } from "@/types/document";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

export const QuestionCard = ({ q, index, closeInteractiveBtn = false }: { q: GeneratedQuestion; index: number, closeInteractiveBtn?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleOpenInStudio = () => {
    router.push(`/dashboard/interactive-studio?questionId=${q.id}`);
  };

  return (
    <Card
      key={q.id}
      className="overflow-hidden border-gray-100 shadow-none hover:border-indigo-200 transition-colors"
    >
      <CardHeader className="px-6 flex items-center">
        <div className="flex bg-slate-50/80 w-full rounded-lg p-2 justify-between gap-4 items-center">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
              {index + 1}
            </span>
            <CardTitle className="text-base font-medium leading-tight text-gray-900">
              {q.question_text}
            </CardTitle>
          </div>
         {!closeInteractiveBtn && <Button
            size="sm"
            variant="outline"
            className="shrink-0 bg-white hover:bg-indigo-50 hover:text-indigo-600 border-gray-200"
            onClick={handleOpenInStudio}
          >
            Open in Studio
          </Button>}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {q.options && (
          <div className="grid gap-2">
            {Object.entries(q.options).map(([k, v]) => (
              <div
                key={k}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                  isExpanded && k === q.correct_answer
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    : "border-gray-100 bg-gray-50/30 text-gray-600"
                }`}
              >
                <span className="font-bold underline decoration-indigo-300 decoration-2 underline-offset-2">
                  {k}.
                </span>
                <span>{v}</span>
                {isExpanded && k === q.correct_answer && (
                  <Badge className="ml-auto bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none border-none text-[10px]">
                    Correct
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <Accordion
          type="single"
          collapsible
          className="w-full"
          onValueChange={(val) => setIsExpanded(!!val)}
        >
          <AccordionItem value="explanation" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:no-underline cursor-pointer">
              View Explanation
            </AccordionTrigger>
            <AccordionContent className="space-y-3 bg-slate-50 rounded-lg p-4 mt-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Correct Answer: {q.correct_answer}
              </div>
              <Separator className="bg-slate-200" />
              <div className="text-sm text-gray-600 leading-relaxed">
                {q.explanation}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}