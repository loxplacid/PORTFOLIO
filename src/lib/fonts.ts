import { Roboto_Flex, Geist_Mono } from "next/font/google";

// Roboto Flex variable axes confirmed from Next.js font-data.json:
// wght 100–1000, wdth 25–151, opsz 8–144, slnt -10–0, GRAD -200–150
export const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  // Requesting all axes we animate so Next.js includes them in the subset
  axes: ["wdth", "opsz", "slnt", "GRAD"],
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const fontVariables = `${robotoFlex.variable} ${geistMono.variable}`;
