"use client"

import { useState, useCallback, useEffect } from "react"
import { useAccount } from "wagmi"
import { sdk } from "@farcaster/frame-sdk"
import { useMiniApp } from "@/contexts/miniapp-context"
import { Navbar } from "./navbar"
import { BusinessModal } from "./business-modal"
import { Business } from "@/lib/supabase"

export function NavbarWrapper() {
  const { context } = useMiniApp()
  const { address, isConnected, isConnecting } = useAccount()

  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false)
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null)

  // Business state
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false)
  const [userBusiness, setUserBusiness] = useState<Business | null>(null)
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false)

  // Extract user data from context
  const user = context?.user
  const displayName = user?.displayName || user?.username || "User"
  const username = user?.username || "user"
  const pfpUrl = user?.pfpUrl

  // Fetch user's business
  const fetchUserBusiness = useCallback(async () => {
    if (!address) return

    setIsLoadingBusiness(true)
    try {
      const response = await fetch(`/api/businesses?wallet=${address}`)
      const data = await response.json()
      setUserBusiness(data.business || null)
    } catch (err) {
      console.error("Failed to fetch user business:", err)
    } finally {
      setIsLoadingBusiness(false)
    }
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      fetchUserBusiness()
    }
  }, [isConnected, address, fetchUserBusiness])

  // Callback when business is created/updated
  const handleBusinessSuccess = useCallback(() => {
    fetchUserBusiness()
  }, [fetchUserBusiness])

  const handleOpenBusinessModal = useCallback(() => {
    setIsBusinessModalOpen(true)
  }, [])

  const handleAddMiniApp = useCallback(async () => {
    if (isAddingMiniApp) return

    setIsAddingMiniApp(true)
    setAddMiniAppMessage(null)

    try {
      const result = await sdk.actions.addMiniApp()
      if (result) {
        setAddMiniAppMessage("Miniapp added successfully!")
      } else {
        setAddMiniAppMessage("Miniapp was not added")
      }
    } catch (error: any) {
      console.error('Add miniapp error:', error)
      if (error?.message?.includes('domain')) {
        setAddMiniAppMessage("Only available from official domain")
      } else {
        setAddMiniAppMessage("Failed to add miniapp")
      }
    } finally {
      setIsAddingMiniApp(false)
    }
  }, [isAddingMiniApp])

  return (
    <>
      <Navbar
        user={user ? {
          displayName,
          username,
          pfpUrl,
        } : undefined}
        walletAddress={address}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onAddMiniApp={handleAddMiniApp}
        isAddingMiniApp={isAddingMiniApp}
        addMiniAppMessage={addMiniAppMessage}
        userBusiness={userBusiness}
        isLoadingBusiness={isLoadingBusiness}
        onOpenBusinessModal={handleOpenBusinessModal}
      />
      <BusinessModal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        userWallet={address || ""}
        userName={displayName}
        existingBusiness={userBusiness}
        onSuccess={handleBusinessSuccess}
      />
    </>
  )
}
