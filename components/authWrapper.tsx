// components/AuthWrapper.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isLogin } from '@/lib/Auth';
import { Loader2 } from 'lucide-react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await isLogin();
        const publicPaths = ['/login', '/register'];
        const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

        if (!isPublicPath && !user) {
          setAuthState('unauthenticated');
          router.push('/login');
          return;
        }
        
        setAuthState('authenticated');
      } catch (error) {
        console.error("Authentication error:", error);
        setAuthState('unauthenticated');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (authState === 'loading') {
    return null
  }

  if (authState === 'unauthenticated') {
    return null; // Prevents flash of content before redirect
  }

  return <>{children}</>;
}