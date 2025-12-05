import { NextRequest, NextResponse } from "next/server";
import { getSupabase, CreateBusinessInput } from "@/lib/supabase";

// GET - List all businesses or get user's business
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (walletAddress) {
      // Get specific user's business
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ business: data || null });
    }

    // Get all businesses
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ businesses: data || [] });
  } catch (error: any) {
    console.error("Businesses API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

// POST - Create a new business
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body: CreateBusinessInput = await request.json();

    // Validate required fields
    if (
      !body.wallet_address ||
      !body.owner_name ||
      !body.business_name ||
      !body.description ||
      body.cashback_percentage === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has a business
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("wallet_address", body.wallet_address.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a business registered" },
        { status: 400 }
      );
    }

    // Create the business
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        wallet_address: body.wallet_address.toLowerCase(),
        owner_name: body.owner_name,
        business_name: body.business_name,
        description: body.description,
        cashback_percentage: body.cashback_percentage,
        cover_image_url: body.cover_image_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ business: data }, { status: 201 });
  } catch (error: any) {
    console.error("Create business error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create business" },
      { status: 500 }
    );
  }
}
