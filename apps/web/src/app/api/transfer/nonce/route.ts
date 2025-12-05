import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

const CHANCHIS_TOKEN_ADDRESS = "0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418" as const;

// ERC20 Permit ABI for nonces, name, and DOMAIN_SEPARATOR
const TOKEN_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ name: "", type: "string" }],
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

    const sponsorPrivateKey = process.env.SPONSOR_WALLET_PRIVATE_KEY;

    if (!sponsorPrivateKey) {
      return NextResponse.json(
        { error: "Sponsor wallet not configured" },
        { status: 500 }
      );
    }

    // Get sponsor address from private key
    const account = privateKeyToAccount(`0x${sponsorPrivateKey.replace("0x", "")}`);

    const client = createPublicClient({
      chain: celo,
      transport: http(),
    });

    // Get the nonce for the owner and token name
    const [nonce, tokenName] = await Promise.all([
      client.readContract({
        address: CHANCHIS_TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "nonces",
        args: [owner as `0x${string}`],
      }),
      client.readContract({
        address: CHANCHIS_TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "name",
      }),
    ]);

    // Try to get version, default to "1" if not available
    let version = "1";
    try {
      version = await client.readContract({
        address: CHANCHIS_TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "version",
      });
    } catch {
      // Version function may not exist, use default
    }

    console.log("Token name:", tokenName);
    console.log("Version:", version);
    console.log("Nonce:", nonce.toString());
    console.log("Spender:", account.address);

    return NextResponse.json({
      nonce: nonce.toString(),
      spender: account.address,
      tokenName,
      version,
    });
  } catch (error: any) {
    console.error("Nonce fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get nonce" },
      { status: 500 }
    );
  }
}
