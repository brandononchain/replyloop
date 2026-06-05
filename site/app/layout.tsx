import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Replyloop — Every review answered, in your voice",
  description:
    "Every review answered, by an agent that sounds like you. Connect Claude to Google, Yelp, Trustpilot, and G2 — read, reply, and spot trends from one conversation.",
  openGraph: {
    title: "Replyloop — Every review answered, in your voice",
    description:
      "Every review answered, by an agent that sounds like you. Reputation management for Claude.",
    url: "https://replyloop.dev",
    siteName: "Replyloop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replyloop — Every review answered, in your voice",
    description:
      "Every review answered, by an agent that sounds like you. Connect Claude to your review platforms.",
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
