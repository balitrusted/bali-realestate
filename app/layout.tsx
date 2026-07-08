import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AttributionCapture from "@/components/AttributionCapture";
import { SavedProvider } from "@/components/SavedProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";

/* Typography: V1 = Inter (see docs/TYPOGRAPHY-VERSIONS.md to rollback). V2 = IBM Plex Sans. */
const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com"),
  title: {
    default: "Balitrusted | Bali villas for rent & local guides",
    template: "%s | Balitrusted",
  },
  description:
    "Villas and land for rent in Bali—especially Ubud—with transparent pricing, guides, and Q&A. A calmer way to search than noisy listing feeds.",
  keywords: [
    "bali villa rent",
    "ubud villa rental",
    "seminyak villa",
    "sanur villa rental",
    "bali real estate",
    "rent villa bali",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {googleSiteVerification ? (
          <meta name="google-site-verification" content={googleSiteVerification} />
        ) : null}
      </head>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <GoogleAnalytics />
        <AttributionCapture />
        <SavedProvider>
          <CurrencyProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </CurrencyProvider>
        </SavedProvider>
      </body>
    </html>
  );
}
