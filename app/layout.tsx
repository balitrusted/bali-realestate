import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";

/* Typography: V1 = Inter (see docs/TYPOGRAPHY-VERSIONS.md to rollback). V2 = IBM Plex Sans. */
const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Balitrusted | Long-term Rentals and Investments",
    template: "%s | Balitrusted",
  },
  description: "Platform for real estate in Bali for long-term living and investments. No noise. No spam. No tourist approach.",
  keywords: ["bali real estate", "bali villa rental", "long-term rental", "bali investments", "ubud real estate"],
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
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
