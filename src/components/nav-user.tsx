// src/components/nav-user.tsx
"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
} from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/providers/NotificationProvider" // Import the useNotification hook

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session, status } = useSession()
  const { addNotification } = useNotification() // Initialize the notification hook

  // Loading state
  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="h-4 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Button
            variant="outline"
            size="lg"
            onClick={() => signIn('google')}
            className="w-full justify-start h-12"
          >
            <User className="h-8 w-8 rounded-lg mr-3" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Sign In</span>
              <span className="truncate text-xs">Connect your account</span>
            </div>
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Authenticated state
  const user = session?.user
  if (!user) return null

  const handleSignOut = () => {
    signOut()
  }

  // Notification handlers for menu items
  const handleUpgradeClick = () => {
    addNotification(
      'info',
      'Upgrade to Pro',
      'The Upgrade to Pro feature is coming soon! Get ready for exclusive benefits.',
      5000 // Display for 5 seconds
    );
  };

  const handleAccountClick = () => {
    addNotification(
      'info',
      'Account Settings',
      'Your account settings are under construction. Stay tuned for personalized options!',
      5000
    );
  };

  const handleBillingClick = () => {
    addNotification(
      'info',
      'Billing Information',
      'Billing management will be available soon. We\'ll keep you updated!',
      5000
    );
  };

  const handleNotificationsClick = () => {
    addNotification(
      'info',
      'Notification Preferences',
      'Manage your notification settings here soon. Don\'t miss out!',
      5000
    );
  };


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name || "User"}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-border"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name || "User"}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleUpgradeClick}>
                <Sparkles className="mr-2 size-4" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleAccountClick}>
                <BadgeCheck className="mr-2 size-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBillingClick}>
                <CreditCard className="mr-2 size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNotificationsClick}>
                <Bell className="mr-2 size-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}