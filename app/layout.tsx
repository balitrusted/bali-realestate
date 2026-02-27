import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} antialiased`}>
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
