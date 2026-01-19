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
  displayName: z.string().min(3, {
    message: "Display name must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const signup = useAuthStore((state) => state.signup);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setMessage('');
    try {
        const data = await signup(values.email, values.password, values.displayName);
        const response = data as {
          message?: string;
          session?: { access_token?: string };
        };
        
        // Check if email confirmation is required
        if (response.message?.includes('check your email')) {
            setMessage(response.message);
        } else if (response.session?.access_token) {
            // Auto-login successful, redirect to dashboard
            setMessage('Account created successfully! Redirecting...');
            setTimeout(() => {
                router.push('/dashboard');
                router.refresh();
            }, 1000);
        } else {
            setMessage('Account created successfully!');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Signup failed';
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
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Get started with QuestAI
          </p>
        </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
            
            {message && (
                <div className={`p-3 rounded border text-sm ${message.includes('Error') ? 'bg-red-100 border-red-200 text-red-600' : 'bg-green-100 border-green-200 text-green-600'}`}>
                    {message}
                </div>
            )}
            
            <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <span 
                    onClick={() => router.push('/login')} 
                    className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
                >
                    Sign in
                </span>
            </div>
        </div>
      </div>
  );
}
