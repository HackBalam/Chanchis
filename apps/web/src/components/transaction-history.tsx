"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenDecimal: string;
  timeStamp: string;
  type: "in" | "out";
}

interface TransactionHistoryProps {
  address: string;
  refreshTrigger?: number;
}

function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const txTime = parseInt(timestamp) * 1000;
  const diff = now - txTime;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(txTime);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatAmount(value: string, decimals: string): string {
  try {
    const formatted = formatUnits(BigInt(value), parseInt(decimals));
    const num = parseFloat(formatted);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } catch {
    return "0";
  }
}

export function TransactionHistory({ address, refreshTrigger }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions?address=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transactions");
      }

      setTransactions(data.transactions || []);
    } catch (err: any) {
      console.error("Failed to fetch transactions:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Transaction History</h3>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {/* Loading State */}
        {isLoading && transactions.length === 0 && (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-8 text-center">
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
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && transactions.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Your CHNC transfers will appear here
            </p>
          </div>
        )}

        {/* Transaction List */}
        {!isLoading && !error && transactions.length > 0 && (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <a
                key={tx.hash}
                href={`https://celoscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white"
                  style={{
                    borderColor: tx.type === "in" ? '#4ecdc4' : '#ff6b6b'
                  }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: tx.type === "in" ? '#4ecdc4' : '#ff6b6b' }}
                  >
                    {tx.type === "in" ? "+" : "-"}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {tx.type === "in" ? "Received" : "Sent"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {tx.type === "in" ? "From " : "To "}
                    {formatAddress(tx.type === "in" ? tx.from : tx.to)}
                  </p>
                </div>

                {/* Amount & Time */}
                <div className="text-right">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: tx.type === "in" ? '#4ecdc4' : '#ff6b6b' }}
                  >
                    {tx.type === "in" ? "+" : "-"}
                    {formatAmount(tx.value, tx.tokenDecimal)} {tx.tokenSymbol}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTimeAgo(tx.timeStamp)}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
