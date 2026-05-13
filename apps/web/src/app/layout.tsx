import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Compralo", template: "%s · Compralo" },
  description: "Buy and sell new and used — including cars.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
