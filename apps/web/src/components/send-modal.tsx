"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSignTypedData } from "wagmi";
import { parseUnits } from "viem";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  tokenBalance: string;
  onTransferComplete: () => void;
}

type Step = "amount" | "recipient" | "confirming" | "success" | "error";

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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const { signTypedDataAsync } = useSignTypedData();

  // Stop camera function
  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep("amount");
      setAmount("");
      setRecipientAddress("");
      setErrorMessage("");
      setCameraError(null);
      setIsProcessing(false);
    }
  }, [isOpen, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera not supported in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setCameraActive(true);
                scanningRef.current = true;
                scanForQRCode();
              })
              .catch((err) => {
                console.error("Video play error:", err);
                setCameraError("Could not start video stream");
                stopCamera();
              });
          }
        };
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Please enter address manually.");
      }
    }
  };

  const scanForQRCode = async () => {
    if (!videoRef.current || !streamRef.current || !scanningRef.current) return;

    // Check if BarcodeDetector is available
    if ("BarcodeDetector" in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        const detectQR = async () => {
          if (!videoRef.current || !streamRef.current || !scanningRef.current) return;

          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const scannedValue = barcodes[0].rawValue;
              // Check if it's a valid Ethereum address
              if (scannedValue && scannedValue.match(/^0x[a-fA-F0-9]{40}$/)) {
                handleAddressScanned(scannedValue);
                return;
              }
            }
          } catch (err) {
            // Silently continue scanning
          }

          // Continue scanning
          if (scanningRef.current) {
            requestAnimationFrame(detectQR);
          }
        };

        detectQR();
      } catch (err) {
        console.error("BarcodeDetector error:", err);
      }
    }
  };

  const handleAddressScanned = (address: string) => {
    setRecipientAddress(address);
    stopCamera();
  };

  const proceedToRecipient = () => {
    setStep("recipient");
    // Try to start camera automatically
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const executeTransfer = async () => {
    if (!recipientAddress || !recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setErrorMessage("Please enter a valid Ethereum address");
      return;
    }

    stopCamera();
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

      const { nonce, spender, tokenName, version } = await nonceResponse.json();

      console.log("Token name from API:", tokenName);
      console.log("Version from API:", version);
      console.log("Nonce:", nonce);
      console.log("Spender:", spender);

      // Create permit signature with correct domain from contract
      const domain = {
        name: tokenName || "Chanchis",
        version: version || "1",
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
          to: recipientAddress,
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
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        {step !== "confirming" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
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
              onClick={proceedToRecipient}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(tokenBalance)}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Continue
            </button>
          </>
        )}

        {/* Recipient Step */}
        {step === "recipient" && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recipient</h2>
              <p className="text-sm text-gray-500 mt-1">
                Scan QR or enter wallet address
              </p>
            </div>

            {/* Camera Section */}
            <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-900" style={{ minHeight: "200px" }}>
              <video
                ref={videoRef}
                className="w-full h-48 object-cover"
                playsInline
                muted
                autoPlay
              />

              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-500 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-400 text-sm text-center">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-2 text-orange-500 text-sm underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {cameraActive && (
                <>
                  <div className="absolute inset-0 border-2 border-orange-500 rounded-xl pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 border-2 border-white/70 rounded-lg">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Scanning for QR code...
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Manual Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter address manually
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-mono"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  stopCamera();
                  setStep("amount");
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={executeTransfer}
                disabled={!recipientAddress}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
              >
                Send {amount} CHNC
              </button>
            </div>
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
