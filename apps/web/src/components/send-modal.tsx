"use client";

import { useState, useRef, useEffect } from "react";
import { useSignTypedData } from "wagmi";
import { parseUnits } from "viem";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  tokenBalance: string;
  onTransferComplete: () => void;
}

type Step = "amount" | "scanner" | "confirming" | "success" | "error";

// EIP-2612 Permit type data
const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const CHANCHIS_TOKEN_ADDRESS = "0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418";
const CELO_CHAIN_ID = 42220;

export function SendModal({
  isOpen,
  onClose,
  userAddress,
  tokenBalance,
  onTransferComplete,
}: SendModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { signTypedDataAsync } = useSignTypedData();

  // Cleanup camera on unmount or close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("amount");
      setAmount("");
      setRecipientAddress("");
      setErrorMessage("");
      setIsProcessing(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setStep("scanner");

      // Start scanning for QR codes
      scanForQRCode();
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMessage("Could not access camera. Please enter address manually.");
    }
  };

  const scanForQRCode = async () => {
    if (!videoRef.current || !streamRef.current) return;

    // Check if BarcodeDetector is available
    if ("BarcodeDetector" in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });

      const detectQR = async () => {
        if (!videoRef.current || !streamRef.current) return;

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const address = barcodes[0].rawValue;
            if (address && address.startsWith("0x") && address.length === 42) {
              handleAddressScanned(address);
              return;
            }
          }
        } catch (err) {
          console.error("QR detection error:", err);
        }

        // Continue scanning
        if (streamRef.current) {
          requestAnimationFrame(detectQR);
        }
      };

      detectQR();
    } else {
      // Fallback: Show manual input
      setErrorMessage(
        "QR scanner not supported in this browser. Please enter address manually."
      );
    }
  };

  const handleAddressScanned = (address: string) => {
    setRecipientAddress(address);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    executeTransfer(address);
  };

  const handleManualAddress = () => {
    if (recipientAddress && recipientAddress.startsWith("0x") && recipientAddress.length === 42) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      executeTransfer(recipientAddress);
    } else {
      setErrorMessage("Please enter a valid Ethereum address");
    }
  };

  const executeTransfer = async (toAddress: string) => {
    setStep("confirming");
    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Convert amount to wei (18 decimals)
      const amountInWei = parseUnits(amount, 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

      // Get nonce from the API
      const nonceResponse = await fetch("/api/transfer/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: userAddress }),
      });

      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }

      const { nonce, spender } = await nonceResponse.json();

      // Create permit signature
      const domain = {
        name: "Chanchis",
        version: "1",
        chainId: CELO_CHAIN_ID,
        verifyingContract: CHANCHIS_TOKEN_ADDRESS as `0x${string}`,
      };

      const message = {
        owner: userAddress as `0x${string}`,
        spender: spender as `0x${string}`,
        value: amountInWei,
        nonce: BigInt(nonce),
        deadline: deadline,
      };

      // Sign the permit
      const signature = await signTypedDataAsync({
        domain,
        types: PERMIT_TYPES,
        primaryType: "Permit",
        message,
      });

      // Send transfer request to API
      const transferResponse = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: userAddress,
          to: toAddress,
          amount: amountInWei.toString(),
          deadline: deadline.toString(),
          signature,
        }),
      });

      const result = await transferResponse.json();

      if (!transferResponse.ok) {
        throw new Error(result.error || "Transfer failed");
      }

      setStep("success");
      onTransferComplete();
    } catch (err: any) {
      console.error("Transfer error:", err);
      setErrorMessage(err.message || "Transfer failed. Please try again.");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step !== "confirming" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        {/* Close Button */}
        {step !== "confirming" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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
        )}

        {/* Amount Step */}
        {step === "amount" && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-orange-600"
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
              </div>
              <h2 className="text-xl font-bold text-gray-900">Send CHNC</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter the amount you want to send
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  CHNC
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Available: {Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} CHNC
              </p>
            </div>

            <button
              onClick={startScanner}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(tokenBalance)}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
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
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Scan QR Code
            </button>
          </>
        )}

        {/* Scanner Step */}
        {step === "scanner" && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Scan Wallet QR</h2>
              <p className="text-sm text-gray-500 mt-1">
                Point your camera at the recipient&apos;s QR code
              </p>
            </div>

            <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 border-2 border-orange-500 rounded-xl pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4">
                <p className="text-sm text-red-500 mb-2">{errorMessage}</p>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-mono"
                />
                <button
                  onClick={handleManualAddress}
                  className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Send to Address
                </button>
              </div>
            )}

            <p className="text-center text-sm text-gray-500">
              Sending <span className="font-bold text-orange-600">{amount} CHNC</span>
            </p>
          </>
        )}

        {/* Confirming Step */}
        {step === "confirming" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Transfer</h2>
            <p className="text-sm text-gray-500">
              Please sign the transaction in your wallet...
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
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
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Transfer Complete!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Successfully sent <span className="font-bold text-orange-600">{amount} CHNC</span>
            </p>
            <button
              onClick={onClose}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600"
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
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Transfer Failed</h2>
            <p className="text-sm text-red-500 mb-6">{errorMessage}</p>
            <button
              onClick={() => setStep("amount")}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
