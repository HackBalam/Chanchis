"use client";

import { useState, useEffect, useCallback } from "react";
import { Business } from "@/lib/supabase";
import { BusinessCard } from "./business-card";

interface BusinessListProps {
  userWallet?: string;
  onEditBusiness?: (business: Business) => void;
  refreshTrigger?: number;
}

export function BusinessList({
  userWallet,
  onEditBusiness,
  refreshTrigger,
}: BusinessListProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/businesses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch businesses");
      }

      setBusinesses(data.businesses || []);
    } catch (err: any) {
      console.error("Failed to fetch businesses:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses, refreshTrigger]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Affiliated Stores
        </h2>
        <p className="text-sm text-gray-500">
          Businesses that accept Chanchis tokens
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-36 bg-gray-200" />
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-full mb-1" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">Error loading stores</p>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchBusinesses}
            className="text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && businesses.length === 0 && (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No stores yet</h3>
          <p className="text-sm text-gray-500">
            Be the first to register your business and start accepting Chanchis!
          </p>
        </div>
      )}

      {/* Business List */}
      {!isLoading && !error && businesses.length > 0 && (
        <div className="space-y-4">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              isOwner={
                userWallet?.toLowerCase() === business.wallet_address.toLowerCase()
              }
              onEdit={
                userWallet?.toLowerCase() === business.wallet_address.toLowerCase()
                  ? () => onEditBusiness?.(business)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {!isLoading && !error && businesses.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-400">
          {businesses.length} store{businesses.length !== 1 ? "s" : ""} affiliated
        </div>
      )}
    </div>
  );
}
