import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

const CHANCHIS_TOKEN_ADDRESS = "0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418";

// ERC20 Permit nonces ABI
const NONCES_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const { owner } = await request.json();

    if (!owner) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 });
    }

    const sponsorAddress = process.env.SPONSOR_WALLET_ADDRESS;

    if (!sponsorAddress) {
      return NextResponse.json(
        { error: "Sponsor wallet not configured" },
        { status: 500 }
      );
    }

    const client = createPublicClient({
      chain: celo,
      transport: http(),
    });

    // Get the nonce for the owner
    const nonce = await client.readContract({
      address: CHANCHIS_TOKEN_ADDRESS as `0x${string}`,
      abi: NONCES_ABI,
      functionName: "nonces",
      args: [owner as `0x${string}`],
    });

    return NextResponse.json({
      nonce: nonce.toString(),
      spender: sponsorAddress,
    });
  } catch (error: any) {
    console.error("Nonce fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get nonce" },
      { status: 500 }
    );
  }
}
