import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ChatbotBubble from "@/components/ChatbotBubble";
import AnalyticsLoader from "@/components/AnalyticsLoader";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceWorkerInit from "@/components/ServiceWorkerInit";
import ScrollToTop from "@/components/ScrollToTop";
import { createServiceClient } from "@/utils/supabase/service";

const geist = Geist({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#92400e",
};

export const metadata: Metadata = {
  title: "Lokidia Games — Encyclopédie des Jeux de Société",
  description: "Lokidia Games : découvrez, comparez et choisissez vos jeux de société avec l'aide de l'IA.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lokidia",
  },
  icons: {
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
};

async function getTopGames() {
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("jeux")
      .select("slug, nom")
      .eq("actif", true)
      .order("note", { ascending: false })
      .limit(5);
    return (data ?? []) as { slug: string; nom: string }[];
  } catch {
    return [];
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const topGames = await getTopGames();

  return (
    <html lang="fr">
      <body className={`${geist.className} bg-amber-50 min-h-screen flex flex-col`}>
        <NavbarWrapper />
        <main className="flex-1">{children}</main>
        <Footer topGames={topGames} />
        <CookieBanner />
        <AnalyticsLoader />
        <ScrollToTop />
        <ChatbotBubble />
        <InstallPrompt />
        <ServiceWorkerInit />
      </body>
    </html>
  );
}
