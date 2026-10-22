import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getDict } from "@/lib/i18n/server";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: { default: "SupplyGuard", template: "%s · SupplyGuard" },
    description: t.app.description,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${barlowCondensed.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[0.9375rem]">
        {/* El idioma se lee de una cookie: el Suspense mantiene ese acceso dentro de un límite */}
        <Suspense>
          <LocaleProvider>{children}</LocaleProvider>
        </Suspense>
        <Toaster
          position="bottom-right"
          mobileOffset={{ bottom: "5.5rem" }}
          toastOptions={{
            className: "font-sans !rounded-md !border-line !text-ink",
          }}
        />
      </body>
    </html>
  );
}
