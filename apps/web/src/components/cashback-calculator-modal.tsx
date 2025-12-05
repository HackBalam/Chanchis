"use client";

import { useState, useEffect } from "react";
import { Business } from "@/lib/supabase";

const CHNC_PRICE_USD = 0.25;

interface CashbackCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
}

export function CashbackCalculatorModal({
  isOpen,
  onClose,
  business,
}: CashbackCalculatorModalProps) {
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPurchaseAmount("");
      setCopied(false);
    }
  }, [isOpen]);

  const purchaseUsd = parseFloat(purchaseAmount) || 0;
  const cashbackUsd = purchaseUsd * (business.cashback_percentage / 100);
  const chncAmount = cashbackUsd / CHNC_PRICE_USD;

  const handleCopy = async () => {
    if (chncAmount > 0) {
      await navigator.clipboard.writeText(chncAmount.toFixed(2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4" style={{ backgroundColor: '#ffd166' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-800"
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
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Cashback Calculator
                </h2>
                <p className="text-gray-700 text-sm">{business.business_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Cashback Info */}
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(255, 209, 102, 0.2)' }}>
            <span className="text-gray-700 font-medium">Your Cashback Rate</span>
            <span className="text-2xl font-bold" style={{ color: '#d4a017' }}>
              {business.cashback_percentage}%
            </span>
          </div>

          {/* Purchase Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Total (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-[#ffd166] text-lg"
                style={{ outlineColor: '#ffd166' }}
                autoFocus
              />
            </div>
          </div>

          {/* Calculation Results */}
          {purchaseUsd > 0 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Cashback in USD */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Cashback Amount</span>
                <span className="font-semibold text-gray-900">
                  ${cashbackUsd.toFixed(2)} USD
                </span>
              </div>

              {/* CHNC Price Reference */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">CHNC Price</span>
                <span className="text-gray-500">
                  ${CHNC_PRICE_USD.toFixed(2)} USD
                </span>
              </div>

              {/* CHNC to Give */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 209, 102, 0.15)' }}>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">CHNC to Give</p>
                  <p className="text-3xl font-bold" style={{ color: '#d4a017' }}>
                    {chncAmount.toFixed(2)} CHNC
                  </p>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-500"
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
                    Copied!
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy CHNC Amount
                  </>
                )}
              </button>
            </div>
          )}

          {/* Empty State */}
          {purchaseUsd === 0 && (
            <div className="text-center py-4 text-gray-400">
              <p>Enter a purchase amount to calculate cashback</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
