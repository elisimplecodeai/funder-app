'use client';

import { usePathname } from 'next/navigation';
import AuthProvider from "@/components/AuthProvider";
import ThemeProvider from "@/components/ThemeProvider";
import ModalProvider from "@/components/ModalProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't run AuthProvider on root, login, or other auth pages
  const shouldSkipAuth = pathname === '/' || pathname === '/login' || pathname.startsWith('/funder-selection');

  return (
    <ThemeProvider>
      {shouldSkipAuth ? (
        <ModalProvider>
          {children}
        </ModalProvider>
      ) : (
      <AuthProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </AuthProvider>
      )}
    </ThemeProvider>
  );
} 