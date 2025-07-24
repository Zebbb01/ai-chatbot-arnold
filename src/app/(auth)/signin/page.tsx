// src/app/(auth)/signin/page.tsx
'use client';

import { signIn, getSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Calendar, MessageCircle, Shield } from 'lucide-react';
import Image from 'next/image'; // Import the Image component

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl);
      }
    });
  }, [router, callbackUrl]);

  const handleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl,
        redirect: true
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  }, [callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4"> {/* Use bg-background */}
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-border bg-card text-card-foreground"> {/* Use theme variables for card */}
          <CardHeader className="text-center space-y-4">
            {/* Logo Section - Use Image component and theme colors */}
            <div className="mx-auto w-16 h-16 relative rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <Image
                src="/img/logo.png" // Ensure this path is correct
                alt="Arnold Logo"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-full"
                sizes="64px" // Specific size for this logo
              />
            </div>
            {/* End Logo Section */}
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Welcome to Arnold</CardTitle> {/* Use text-foreground */}
              <CardDescription className="text-muted-foreground mt-2"> {/* Use text-muted-foreground */}
                Your AI-powered scheduling assistant
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="flex items-center gap-3 text-sm text-foreground"> {/* Use text-foreground */}
                <MessageCircle className="size-5 text-primary" /> {/* Use text-primary */}
                <span>Smart conversational AI assistant</span>
              </div>
              {/* Feature 2 */}
              <div className="flex items-center gap-3 text-sm text-foreground"> {/* Use text-foreground */}
                <Calendar className="size-5 text-primary" /> {/* Use text-primary */}
                <span>Seamless Google Calendar integration</span>
              </div>
              {/* Feature 3 */}
              <div className="flex items-center gap-3 text-sm text-foreground"> {/* Use text-foreground */}
                <Shield className="size-5 text-primary" /> {/* Use text-primary */}
                <span>Secure conversation history</span>
              </div>
            </div>

            <div className="border-t border-border pt-4"> {/* Use border-border */}
              <p className="text-xs text-muted-foreground text-center mb-4"> {/* Use text-muted-foreground */}
                Sign in with your Google account to get started
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> {/* Use primary-foreground */}
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Google Icon SVG - updated fill to currentColor for theme compatibility */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor" // This will inherit text-primary-foreground
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor" // This will inherit text-primary-foreground
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor" // This will inherit text-primary-foreground
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor" // This will inherit text-primary-foreground
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4"> {/* Use text-muted-foreground */}
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}