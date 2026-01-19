'use client';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuthStore } from '@/stores/authStore';

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const login = useAuthStore((state) => state.login);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setMessage('');
    try {
        const data = await login(values.email, values.password);
        const session = (data as { session?: { access_token?: string } }).session;
        if (session?.access_token) {
          // Cookie is set by the backend; just redirect.
          router.push('/dashboard');
          router.refresh();
        } else {
          throw new Error("No session returned");
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setMessage(`Error: ${errorMessage}`);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
            
            {message && (
                <div className="p-3 rounded bg-red-100 border border-red-200 text-sm text-red-600">
                    {message}
                </div>
            )}
            
            <div className="text-center text-sm">
                <span className="text-gray-600">Don&apos;t have an account? </span>
                <span 
                    onClick={() => router.push('/signup')} 
                    className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
                >
                    Sign up
                </span>
            </div>
        </div>
      </div>
  );
}
