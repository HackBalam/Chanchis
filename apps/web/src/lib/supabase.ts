import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Types for the businesses table
export interface Business {
  id: string;
  wallet_address: string;
  owner_name: string;
  business_name: string;
  description: string;
  location: string | null;
  cashback_percentage: number;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessInput {
  wallet_address: string;
  owner_name: string;
  business_name: string;
  description: string;
  location?: string | null;
  cashback_percentage: number;
  cover_image_url?: string | null;
}

export interface UpdateBusinessInput {
  business_name?: string;
  description?: string;
  location?: string | null;
  cashback_percentage?: number;
  cover_image_url?: string | null;
}
