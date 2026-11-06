import type { Metadata } from "next";
import "./proto.css";
import "./app.css";
import { GraphProvider } from "@/components/store";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Neuron",
  description: "Your personal knowledge graph",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <GraphProvider>
          <div className="shell">
            <Sidebar />
            {children}
          </div>
        </GraphProvider>
      </body>
    </html>
  );
}
