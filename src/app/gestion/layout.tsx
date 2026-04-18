import type { ReactNode } from "react";
import { headers } from "next/headers";
import AdminNav from "./_components/AdminNav";

export default async function GestionLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";

  // Login page: no sidebar, just the raw page
  if (pathname.startsWith("/gestion/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <AdminNav />
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
