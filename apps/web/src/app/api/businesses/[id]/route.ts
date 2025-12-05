import { NextRequest, NextResponse } from "next/server";
import { getSupabase, UpdateBusinessInput } from "@/lib/supabase";

// GET - Get a specific business by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ business: data });
  } catch (error: any) {
    console.error("Get business error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch business" },
      { status: 500 }
    );
  }
}

// PUT - Update a business
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const body: UpdateBusinessInput & { wallet_address: string } = await request.json();

    // Verify ownership
    const { data: existing } = await supabase
      .from("businesses")
      .select("wallet_address")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (existing.wallet_address !== body.wallet_address?.toLowerCase()) {
      return NextResponse.json(
        { error: "You can only edit your own business" },
        { status: 403 }
      );
    }

    // Update the business
    const updateData: UpdateBusinessInput & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (body.business_name) updateData.business_name = body.business_name;
    if (body.description) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.cashback_percentage !== undefined)
      updateData.cashback_percentage = body.cashback_percentage;
    if (body.cover_image_url !== undefined)
      updateData.cover_image_url = body.cover_image_url;

    const { data, error } = await supabase
      .from("businesses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ business: data });
  } catch (error: any) {
    console.error("Update business error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update business" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a business
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("businesses")
      .select("wallet_address")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (existing.wallet_address !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "You can only delete your own business" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("businesses").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete business error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete business" },
      { status: 500 }
    );
  }
}
