import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyMate AI — Smart Job Application Assistant",
  description:
    "Analyze job descriptions, match your CV, identify skill gaps, and generate tailored cover letters, recruiter messages, and interview prep — powered by AI.",
};

/* Inline script that runs before React hydrates to prevent flash of wrong theme.
   Reads from localStorage and sets data-theme on <html>. */
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('applymate-theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
