import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Token facts",
  description: "Solana, Ethereum, and BSC token facts from chain RPC. No risk score.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
