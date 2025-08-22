import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvAlert – Inventory Alert",
  description: "InvAlert – Inventory Alert Platform",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        {children}
      </body>
    </html>
  );
}
