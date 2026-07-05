import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyMate AI — Your AI Job Application Operating System",
  description:
    "One profile. ApplyMate scans trusted job sources, hides low-fit roles, prepares tailored applications, and waits for your approval — then tracks every reply.",
};

/* Inline script that runs before React hydrates to prevent flash of wrong theme,
   and to set the html lang attribute from the stored language preference. */
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('applymate-theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    var l = localStorage.getItem('applymate-lang');
    if (l === 'tr' || l === 'de') document.documentElement.lang = l;
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
