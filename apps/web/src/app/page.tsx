"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useBalance, useWatchBlockNumber } from "wagmi";
import Image from "next/image";
import { ReceiveModal } from "@/components/receive-modal";
import { SendModal } from "@/components/send-modal";
import { TransactionHistory } from "@/components/transaction-history";
import { NavbarBottom } from "@/components/navbar-bottom";
import { BusinessList } from "@/components/business-list";
import { BusinessModal } from "@/components/business-modal";
import { CashbackCalculatorModal } from "@/components/cashback-calculator-modal";
import { Business } from "@/lib/supabase";

// Dirección del token Chanchis (CHNC) en Celo Mainnet
const CHANCHIS_TOKEN_ADDRESS = "0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418" as const;

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isCashbackModalOpen, setIsCashbackModalOpen] = useState(false);
  const [txRefreshTrigger, setTxRefreshTrigger] = useState(0);

  // View state for navbar
  const [activeView, setActiveView] = useState<"home" | "stores">("home");

  // Business state
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [userBusiness, setUserBusiness] = useState<Business | null>(null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);
  const [businessRefreshTrigger, setBusinessRefreshTrigger] = useState(0);

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();

  // Token balance hook for Chanchis (CHNC)
  const { data: tokenBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
    token: CHANCHIS_TOKEN_ADDRESS,
  });

  // Watch for new blocks and refresh balance automatically
  useWatchBlockNumber({
    onBlockNumber: () => {
      refetchBalance();
    },
  });

  // Fetch user's business
  const fetchUserBusiness = useCallback(async () => {
    if (!address) return;

    setIsLoadingBusiness(true);
    try {
      const response = await fetch(`/api/businesses?wallet=${address}`);
      const data = await response.json();
      setUserBusiness(data.business || null);
    } catch (err) {
      console.error("Failed to fetch user business:", err);
    } finally {
      setIsLoadingBusiness(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserBusiness();
    }
  }, [isConnected, address, fetchUserBusiness, businessRefreshTrigger]);

  // Callback to refresh transactions after transfer (balance is updated by useWatchBlockNumber)
  const handleTransferComplete = useCallback(() => {
    // Trigger transaction history refresh after a short delay to allow indexing
    setTimeout(() => {
      setTxRefreshTrigger((prev) => prev + 1);
    }, 3000);
  }, []);

  // Callback when business is created/updated
  const handleBusinessSuccess = useCallback(() => {
    setBusinessRefreshTrigger((prev) => prev + 1);
    fetchUserBusiness();
  }, [fetchUserBusiness]);

  // Handle edit business from stores list
  const handleEditBusiness = useCallback((business: Business) => {
    setUserBusiness(business);
    setIsBusinessModalOpen(true);
  }, []);

  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (isMiniAppReady && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);

  // Extract user data from context
  const user = context?.user;
  const displayName = user?.displayName || user?.username || "User";

  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 pb-20">
      <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-auto p-6">
          {/* HOME VIEW */}
          {activeView === "home" && (
            <>
              {/* Chanchis Token Balance Card */}
              {isConnected && (
                <div className="mb-6 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-2xl p-1 shadow-lg">
                  <div className="bg-white rounded-xl p-5">
                    <div className="flex items-center gap-4">
                      {/* Token Image */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src="/ChainchisToken.png"
                          alt="Chanchis Token"
                          fill
                          className="object-contain rounded-full"
                        />
                      </div>

                      {/* Balance Info */}
                      <div className="flex-1 text-left">
                        <p className="text-sm text-gray-500 font-medium mb-1">Your Balance</p>
                        {isBalanceLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                            <span className="text-gray-400">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-gray-900">
                              {tokenBalance?.formatted ? Number(tokenBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"}
                            </p>
                            <p className="text-sm text-orange-600 font-semibold">
                              {tokenBalance?.symbol || "CHNC"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Receive, Send & Cashback */}
              {isConnected && (
                <div className="mb-6 flex gap-3">
                  {/* Receive Button */}
                  <button
                    onClick={() => setIsReceiveModalOpen(true)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
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
                    <span className="text-sm">Receive</span>
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => setIsSendModalOpen(true)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    <span className="text-sm">Send</span>
                  </button>

                  {/* Cashback Calculator Button - Only for store owners */}
                  {userBusiness && (
                    <button
                      onClick={() => setIsCashbackModalOpen(true)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm">Cashback</span>
                    </button>
                  )}
                </div>
              )}

              {/* Transaction History */}
              {isConnected && address && (
                <div className="mb-6">
                  <TransactionHistory
                    address={address}
                    refreshTrigger={txRefreshTrigger}
                  />
                </div>
              )}

              {/* Create/Edit Store Button */}
              {isConnected && (
                <div className="mb-6">
                  <button
                    onClick={() => setIsBusinessModalOpen(true)}
                    disabled={isLoadingBusiness}
                    className={`w-full font-medium py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                      userBusiness
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    }`}
                  >
                    {isLoadingBusiness ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : userBusiness ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
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
                        <span>Edit My Store</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
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
                        <span>Create Store</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </>
          )}

          {/* STORES VIEW */}
          {activeView === "stores" && (
            <BusinessList
              userWallet={address}
              onEditBusiness={handleEditBusiness}
              refreshTrigger={businessRefreshTrigger}
            />
          )}
        </div>
      </section>

      {/* Bottom Navigation */}
      <NavbarBottom activeView={activeView} onViewChange={setActiveView} />

      {/* Modals */}
      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        address={address || ""}
      />

      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        userAddress={address || ""}
        tokenBalance={tokenBalance?.formatted || "0"}
        onTransferComplete={handleTransferComplete}
      />

      <BusinessModal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        userWallet={address || ""}
        userName={displayName}
        existingBusiness={userBusiness}
        onSuccess={handleBusinessSuccess}
      />

      {userBusiness && (
        <CashbackCalculatorModal
          isOpen={isCashbackModalOpen}
          onClose={() => setIsCashbackModalOpen(false)}
          business={userBusiness}
        />
      )}
    </main>
  );
}
