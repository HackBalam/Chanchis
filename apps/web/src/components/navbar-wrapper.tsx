"use client"

import { useState, useCallback } from "react"
import { useAccount } from "wagmi"
import { sdk } from "@farcaster/frame-sdk"
import { useMiniApp } from "@/contexts/miniapp-context"
import { Navbar } from "./navbar"

export function NavbarWrapper() {
  const { context } = useMiniApp()
  const { address, isConnected, isConnecting } = useAccount()

  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false)
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null)

  // Extract user data from context
  const user = context?.user
  const displayName = user?.displayName || user?.username || "User"
  const username = user?.username || "user"
  const pfpUrl = user?.pfpUrl

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
    />
  )
}
