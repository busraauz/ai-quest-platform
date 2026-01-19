'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function AuthButton() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state and redirect even if request fails
      await logout();
      router.push('/');
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="h-10 w-20 bg-gray-200 animate-pulse rounded" />
        <div className="h-10 w-20 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Button 
          className='bg-indigo-600 hover:bg-indigo-700' 
          onClick={() => router.push('/login')}
        >
          Sign In
        </Button>
        <Button 
          className="border-indigo-600 hover:bg-indigo-700 bg-white border text-indigo-600 hover:text-white" 
          onClick={() => router.push('/signup')}
        >
          Sign Up
        </Button>
      </>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">
        {displayName}
      </span>
      <Button 
        className='bg-indigo-600 hover:bg-indigo-700' 
        onClick={handleLogout}
      >
        Sign Out
      </Button>
    </div>
  );
}
