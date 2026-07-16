import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BitTune — Channel Strip DSP Controller",
  description:
    "Hyper-realistic analog mixing console channel strip for the Ampli-Smart DSP. Control HIGH, MID, LOW EQ, FX, and Master Level via Web Bluetooth.",
  keywords: [
    "ESP32",
    "DSP",
    "Bluetooth",
    "Audio",
    "Channel Strip",
    "Mixer",
    "BLE",
    "Amplifier",
    "Mixing Console",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0d] text-zinc-100 selection:bg-cyan-400/25 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
