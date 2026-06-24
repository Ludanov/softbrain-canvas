import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvas — Coloring Book",
  description: "Interactive digital coloring book — create and color your own artwork with layers, symmetry, and more.",
  openGraph: {
    title: "Canvas — Coloring Book",
    description: "Interactive digital coloring book — create and color your own artwork with layers, symmetry, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* Theme init script — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark')}catch(e){}})();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
