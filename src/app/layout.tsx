// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google'; // Import Inter font

// Configure Inter font with subsets for optimization
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My Awesome Chatbot',
  description: 'An AI-powered chatbot built with Next.js and Ollama.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Apply the font to the html tag
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}