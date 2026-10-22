import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";

// Agrupa las páginas que requieren sesión y les añade la cabecera
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-14 bg-shell" />}>
        <AppHeader />
      </Suspense>
      <main className="enter mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6 sm:pt-10 sm:pb-10">{children}</main>
    </>
  );
}
