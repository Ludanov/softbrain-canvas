import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canvas",
  description: "Canvas creative tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
