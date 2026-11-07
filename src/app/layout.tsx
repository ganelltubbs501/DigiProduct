import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DigiProduct", template: "%s · DigiProduct" },
  description: "Research, build, launch and sell digital products from one dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
