import { ClerkProvider, Show, SignInButton, SignOutButton, SignUpButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { DiscoveriesLink, DiscoveriesLinkBase } from "@/components/discoveries-link";
import { HeaderSearchForm, HeaderSearchIcon } from "@/components/header-search";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "FERA · Living Atlas of Wildlife", template: "%s · FERA" },
  description: "Search real wildlife sightings from around the world and save your favorites.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#f2b84b",
              colorBackground: "#151917",
              colorForeground: "#ecebe6",
              colorInput: "#1e2420",
              colorInputForeground: "#ecebe6",
              colorMutedForeground: "#a3a8a0",
              colorPrimaryForeground: "#1a1405",
            },
          }}
        >
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
            >
              Skip to content
            </a>
            <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:gap-4 sm:px-6">
                <Link href="/" className="inline-flex min-h-11 items-center text-lg font-black uppercase tracking-[0.2em]">
                  Fera
                </Link>
                {/* auth state and the current path are read per request, so they sit inside Suspense (cacheComponents) */}
                <Suspense>
                  <HeaderSearchForm />
                </Suspense>
                <Suspense>
                  <nav aria-label="Main" className="ml-auto flex items-center gap-1 text-sm sm:gap-4">
                    <HeaderSearchIcon />
                    <Show when="signed-out">
                      <SignInButton>
                        <button type="button" className="min-h-11 px-2 text-muted hover:text-foreground">
                          Sign in
                        </button>
                      </SignInButton>
                      <SignUpButton>
                        <button type="button" className="rounded-full bg-accent px-4 py-1.5 font-semibold text-accent-ink">
                          Sign up
                        </button>
                      </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                      <Suspense fallback={<DiscoveriesLinkBase />}>
                        <DiscoveriesLink />
                      </Suspense>
                      <SignOutButton redirectUrl="/">
                        <button type="button" className="hidden min-h-11 px-2 text-muted hover:text-foreground sm:inline">
                          Sign out
                        </button>
                      </SignOutButton>
                      <UserButton />
                    </Show>
                  </nav>
                </Suspense>
              </div>
            </header>
            <div id="main" className="flex flex-1 flex-col">
              {children}
            </div>
            <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-muted sm:px-6">
              Wildlife data and photos from{" "}
              <a href="https://www.inaturalist.org" className="underline hover:text-foreground">
                iNaturalist
              </a>
              . Photos belong to their photographers as credited on each image.
            </footer>
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
