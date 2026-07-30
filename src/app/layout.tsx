import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart HRMS AI | Redfoxa Careerlink",
  description: "HRMS Admin and Candidate portals for Redfoxa Careerlink",
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
