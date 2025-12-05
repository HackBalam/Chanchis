"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Business } from "@/lib/supabase"

interface NavbarProps {
  user?: {
    displayName: string;
    username: string;
    pfpUrl?: string;
  };
  walletAddress?: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  onAddMiniApp?: () => Promise<void>;
  isAddingMiniApp?: boolean;
  addMiniAppMessage?: string | null;
  userBusiness?: Business | null;
  isLoadingBusiness?: boolean;
  onOpenBusinessModal?: () => void;
}

export function Navbar({
  user,
  walletAddress,
  isConnected,
  isConnecting,
  onAddMiniApp,
  isAddingMiniApp,
  addMiniAppMessage,
  userBusiness,
  isLoadingBusiness,
  onOpenBusinessModal,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <Image
                  src="/cerditoCara.png"
                  alt="Chanchis"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-bold text-lg" style={{ color: '#ec4899' }}>
                  Chanchis
                </span>
              </div>

              {/* User Profile Section */}
              {user && (
                <div className="mb-6 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-4">
                  {/* Profile Avatar - Centered above name */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden mb-3">
                      {user.pfpUrl ? (
                        <img
                          src={user.pfpUrl}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                      )}
                    </div>

                    {/* Profile Info - Centered */}
                    <h3 className="font-semibold text-gray-900 truncate text-center">
                      {user.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate text-center">
                      {user.username.startsWith('@') ? user.username : `@${user.username}`}
                    </p>
                  </div>

                  {/* Wallet Status */}
                  <div className="bg-white/80 rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-medium">Wallet</span>
                      <div className={`flex items-center gap-1.5 text-xs ${
                        isConnected ? 'text-green-600' : isConnecting ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                      </div>
                    </div>
                    {walletAddress && (
                      <p className="text-sm text-gray-700 font-mono">
                        {formatAddress(walletAddress)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Create/Edit Store Button */}
              {isConnected && onOpenBusinessModal && (
                <div className="mb-4">
                  <Button
                    onClick={() => {
                      onOpenBusinessModal();
                      setIsOpen(false);
                    }}
                    disabled={isLoadingBusiness}
                    className="w-full justify-center gap-2 py-5 text-white hover:opacity-90"
                    style={{ backgroundColor: '#4ecdc4' }}
                  >
                    {isLoadingBusiness ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading...
                      </>
                    ) : userBusiness ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit My Store
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Create Store
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Connect Wallet Button */}
              <Button
                className="w-full text-white py-5 mb-4 hover:opacity-90"
                style={{ backgroundColor: '#ff6b6b' }}
                disabled={isConnected}
              >
                {isConnected ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Wallet Connected
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>

              {/* Add Miniapp Button */}
              {onAddMiniApp && (
                <div>
                  <Button
                    onClick={onAddMiniApp}
                    disabled={isAddingMiniApp}
                    variant="outline"
                    className="w-full justify-center gap-2 py-5"
                  >
                    {isAddingMiniApp ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Add to Farcaster
                      </>
                    )}
                  </Button>

                  {/* Add Miniapp Status Message */}
                  {addMiniAppMessage && (
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 text-center">{addMiniAppMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/cerditoCara.png"
              alt="Chanchis"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-bold text-xl" style={{ color: '#ec4899' }}>
              Chanchis
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">
                {walletAddress ? formatAddress(walletAddress) : 'Connected'}
              </span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Connect Wallet
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
