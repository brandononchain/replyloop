import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echoback — Reputation management inside Claude",
  description:
    "Connect Claude to Google, Yelp, Trustpilot, and G2. Read reviews, respond instantly, spot trends. All from one conversation.",
  openGraph: {
    title: "Echoback — Your reviews, one conversation away",
    description:
      "Reputation management connector for Claude. Read, respond, and analyze reviews across every platform from a single chat.",
    url: "https://echoback.dev",
    siteName: "Echoback",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Echoback — Reputation management inside Claude",
    description:
      "Connect Claude to your review platforms. Read, respond, analyze. All from one conversation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
