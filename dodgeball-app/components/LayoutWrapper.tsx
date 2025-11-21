'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 학생 페이지에서는 NavBar와 Footer 숨김
  const isStudentPage = pathname?.startsWith('/student');

  if (isStudentPage) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      <div style={{ height: 'calc(100vh - 4rem - 3rem)' }}>
        {children}
      </div>
      <Footer />
    </>
  );
}
