"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UploadCloud, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { config } from "@/lib/config";
import { DocumentGenerateResponse, GeneratedQuestion } from "@/types/document";
import { QuestionCard } from "@/components/QuestionCard";
import { Loading } from "@/components/Loading";

const formSchema = z.object({
  pdf: z
    .instanceof(File, { message: "Please upload a PDF file." })
    .refine((file) => file.type === "application/pdf", {
      message: "Only PDF files are allowed.",
    }),
  questionType: z.enum(["mcq", "open"]),
  quantity: z.string().refine(
    (val) => {
      const num = Number(val);
      return num > 0 && num <= 100;
    },
    {
      message: "Please enter a valid quantity.",
    },
  ),
});

export default function PdfWorkspacePage() {
  const [result, setResult] = useState<DocumentGenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileLabel, setFileLabel] = useState("Drop your PDF here");
  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pdf: undefined,
      questionType: "mcq",
      quantity: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", values.pdf);
      formData.append("question_type", values.questionType);
      formData.append("quantity", String(values.quantity));

      const res = await fetch(`${config.apiBaseUrl}/api/documents/generate`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as DocumentGenerateResponse;
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_45%),radial-gradient(circle_at_20%_80%,_rgba(16,185,129,0.1),_transparent_40%)]" />
      <div className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            PDF Workspace
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Upload a document, pick a question type, and generate in seconds.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"
          >
            <Card className="border-dashed border-gray-200 bg-white/80 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  Upload area
                </CardTitle>
                <CardDescription>
                  Drag and drop a PDF here, or click to browse.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="pdf"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label
                          htmlFor="pdf-upload"
                          className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-indigo-200 bg-white px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md transition group-hover:scale-105">
                            <UploadCloud className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {fileLabel}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              PDF only
                            </p>
                          </div>
                          <Input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            disabled={isLoading}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              field.onChange(file ?? undefined);
                              setFileLabel(
                                file ? file.name : "Drop your PDF here",
                              );
                            }}
                          />
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  Generation settings
                </CardTitle>
                <CardDescription>
                  Choose the question type and quantity to generate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="questionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={isLoading}
                          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="mcq">Multiple choice</option>
                          <option value="open">Open Ended</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          disabled={isLoading}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <Loading
                      size="sm"
                      message="Generating..."
                      className="p-0 flex-row gap-2 text-white"
                    />
                  ) : (
                    "Generate questions"
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>

      {result && result.questions.length > 0 && (
        <div className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Generated Questions
              </h2>
              <p className="text-sm text-gray-500">
                Review and manage your newly created questions.
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {result.questions.length} Questions
            </Badge>
          </div>

          <ScrollArea className="h-[600px] rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="p-6 space-y-6">
              {result.questions.map((q, index) => (
                <QuestionCard key={q.id} q={q} index={index} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
