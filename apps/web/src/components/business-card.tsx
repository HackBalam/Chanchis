"use client";

import Image from "next/image";
import { Business } from "@/lib/supabase";

interface BusinessCardProps {
  business: Business;
  isOwner?: boolean;
  onEdit?: () => void;
}

function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function BusinessCard({ business, isOwner, onEdit }: BusinessCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      {/* Cover Image */}
      <div className="relative h-36 bg-gradient-to-br from-orange-100 to-pink-100">
        {business.cover_image_url ? (
          <Image
            src={business.cover_image_url}
            alt={business.business_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-orange-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        )}

        {/* Cashback Badge */}
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
          {business.cashback_percentage}% Cashback
        </div>

        {/* Edit Button for Owner */}
        {isOwner && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Business Name */}
        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
          {business.business_name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {business.description}
        </p>

        {/* Location */}
        {business.location && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{business.location}</span>
          </div>
        )}

        {/* Owner Info */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>{business.owner_name}</span>
          <span className="text-gray-300">|</span>
          <span className="font-mono">{formatAddress(business.wallet_address)}</span>
        </div>
      </div>
    </div>
  );
}
