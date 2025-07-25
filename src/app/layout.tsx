// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../context/ThemeProvider';
import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ChatHeader from '@/components/chat/ChatHeader'; // Correctly imported
import AuthProvider from '@/components/AuthProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Chat Session',
  description: 'Your ongoing AI chat session',
  icons: {
    icon: '/img/arnold-crop.png'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider><SidebarProvider
              style={
                {
                  "--sidebar-width": "18rem",
                } as React.CSSProperties
              }
            >
              <AppSidebar />
              {/* SidebarInset correctly provides the main content area */}
              <SidebarInset className="flex flex-col h-full w-full">
                <ChatHeader />
                <main className="flex-1 overflow-hidden">

                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}