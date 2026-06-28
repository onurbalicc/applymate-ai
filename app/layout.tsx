import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyMate AI — Smart Job Application Assistant",
  description:
    "Analyze job descriptions, match your CV, identify skill gaps, and generate tailored cover letters, recruiter messages, and interview prep — powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
