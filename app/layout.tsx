import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Labour Guru | Mavelikara",
  description: "Find and request local labour services in Mavelikara, Kerala."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
