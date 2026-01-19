"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UploadCloud, ImagePlus } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { config } from "@/lib/config";
import { Loading } from "@/components/Loading";
import { QuestionCard } from "@/components/QuestionCard";
import { SimilarGenerateResponse } from "@/types/document";

const formSchema = z.object({
  image: z
    .instanceof(File, { message: "Please upload an image of a question." })
    .refine(
      (file) => ["image/png", "image/jpeg", "image/jpg"].includes(file.type),
      {
        message: "Only PNG or JPG images are allowed.",
      },
    ),
  instruction: z
    .string()
    .min(3, { message: "Please provide some context or instructions." }),
  difficulty: z.enum(["easy", "medium", "hard"]),
  quantity: z.string().refine(
    (val) => {
      const num = Number(val);
      return num > 0 && num <= 20;
    },
    {
      message: "Please enter a quantity between 1 and 20.",
    },
  ),
});

export default function SimilarQuestionsPage() {
  const [result, setResult] = useState<SimilarGenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileLabel, setFileLabel] = useState("Drop question image here");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: undefined,
      instruction: "",
      difficulty: "medium",
      quantity: "5",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", values.image);
      formData.append("instruction", values.instruction);
      formData.append("difficulty", values.difficulty);
      formData.append("quantity", values.quantity);

      const res = await fetch(`${config.apiBaseUrl}/api/similar/generate`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to generate questions");
      }

      const data = await res.json();
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

      <div className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 no-scrollbar">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Similar Questions
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Upload an image of a question and describe how you want clones to be
            generated.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"
          >
            <div className="space-y-6">
              <Card className="border-gray-200 bg-white shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">
                    Source Input
                  </CardTitle>
                  <CardDescription>
                    Upload an image of the question and specify how to clone it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative group">
                    <FormField
                      control={form.control}
                      name="instruction"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <textarea
                              {...field}
                              disabled={isLoading}
                              rows={8}
                              placeholder="Example: Generate slightly more complex versions of this physics question focusing on kinematics..."
                              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/30 p-6 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem className="absolute right-4 top-4">
                          <FormControl>
                            <label
                              htmlFor="image-upload"
                              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 cursor-pointer active:scale-95"
                            >
                              <ImagePlus className="h-3.5 w-3.5" />
                              <span className="max-w-[120px] truncate">
                                {fileLabel}
                              </span>
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isLoading}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  field.onChange(file ?? undefined);
                                  setFileLabel(file ? file.name : "Add image");
                                }}
                              />
                            </label>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit border-gray-200 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  Clone Settings
                </CardTitle>
                <CardDescription>
                  Configure the difficulty and quantity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty level</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={isLoading}
                          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
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
                          placeholder="Max 20"
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
                      message="Generating Clones..."
                      className="p-0 flex-row gap-2 text-white"
                    />
                  ) : (
                    "Generate Clones"
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>

      {result && result.questions && result.questions.length > 0 && (
        <div className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Similar Clones
              </h2>
              <p className="text-sm text-gray-500">
                Review and refine the generated similar questions.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-100"
            >
              {result.questions.length} Questions
            </Badge>
          </div>

          <ScrollArea className="h-[600px] no-scrollbar rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="p-6 space-y-6">
              {result.questions.map((q: any, index: number) => (
                <QuestionCard key={q.id || index} q={q} index={index} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
