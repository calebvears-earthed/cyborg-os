import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cyborg OS · Atlas",
  description: "Earthed group operations nervous system · powered by Atlas",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-void text-cream min-h-screen font-body antialiased">
        {children}
      </body>
    </html>
  );
}
