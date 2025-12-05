"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Business } from "@/lib/supabase";

interface BusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userWallet: string;
  userName: string;
  existingBusiness?: Business | null;
  onSuccess: () => void;
}

export function BusinessModal({
  isOpen,
  onClose,
  userWallet,
  userName,
  existingBusiness,
  onSuccess,
}: BusinessModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [cashbackPercentage, setCashbackPercentage] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!existingBusiness;

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingBusiness) {
      setBusinessName(existingBusiness.business_name);
      setDescription(existingBusiness.description);
      setCashbackPercentage(existingBusiness.cashback_percentage.toString());
      setCoverImagePreview(existingBusiness.cover_image_url);
    } else {
      setBusinessName("");
      setDescription("");
      setCashbackPercentage("");
      setCoverImage(null);
      setCoverImagePreview(null);
    }
    setError(null);
  }, [existingBusiness, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!coverImage) return existingBusiness?.cover_image_url || null;

    const formData = new FormData();
    formData.append("file", coverImage);
    formData.append("wallet", userWallet);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload image");
    }

    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate
      if (!businessName.trim()) {
        throw new Error("Business name is required");
      }
      if (!description.trim()) {
        throw new Error("Description is required");
      }
      const cashback = parseFloat(cashbackPercentage);
      if (isNaN(cashback) || cashback < 0 || cashback > 100) {
        throw new Error("Cashback must be between 0 and 100");
      }

      // Upload image if new one selected
      const imageUrl = await uploadImage();

      if (isEditing && existingBusiness) {
        // Update existing business
        const response = await fetch(`/api/businesses/${existingBusiness.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet_address: userWallet,
            business_name: businessName.trim(),
            description: description.trim(),
            cashback_percentage: cashback,
            cover_image_url: imageUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update business");
        }
      } else {
        // Create new business
        const response = await fetch("/api/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet_address: userWallet,
            owner_name: userName,
            business_name: businessName.trim(),
            description: description.trim(),
            cashback_percentage: cashback,
            cover_image_url: imageUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create business");
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? "Edit Store" : "Create Store"}
          </h2>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Auto-filled fields */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Wallet:</span>
              <span className="font-mono text-gray-700">
                {userWallet.slice(0, 6)}...{userWallet.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Owner:</span>
              <span className="text-gray-700">{userName}</span>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 cursor-pointer transition-colors overflow-hidden"
            >
              {coverImagePreview ? (
                <Image
                  src={coverImagePreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">Click to upload</span>
                </div>
              )}
              {coverImagePreview && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">
                    Change Image
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Awesome Store"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers what your business offers..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              required
            />
          </div>

          {/* Cashback Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cashback Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                value={cashbackPercentage}
                onChange={(e) => setCashbackPercentage(e.target.value)}
                placeholder="5"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                %
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Percentage of CHNC returned to customers on purchases
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isEditing ? "Updating..." : "Creating..."}
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
                    d={
                      isEditing
                        ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        : "M12 4v16m8-8H4"
                    }
                  />
                </svg>
                {isEditing ? "Update Store" : "Create Store"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
