import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseSignature } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

const CHANCHIS_TOKEN_ADDRESS = "0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418" as const;

// ERC20 Permit + TransferFrom ABI
const TOKEN_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const { from, to, amount, deadline, signature } = await request.json();

    // Validate inputs
    if (!from || !to || !amount || !deadline || !signature) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const sponsorPrivateKey = process.env.SPONSOR_WALLET_PRIVATE_KEY;

    if (!sponsorPrivateKey) {
      return NextResponse.json(
        { error: "Sponsor wallet not configured" },
        { status: 500 }
      );
    }

    // Create wallet client from sponsor private key
    const account = privateKeyToAccount(`0x${sponsorPrivateKey.replace("0x", "")}`);

    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: celo,
      transport: http(),
    });

    // Parse the signature to extract v, r, s
    const { v, r, s } = parseSignature(signature as `0x${string}`);

    console.log("Executing permit...");
    console.log("From:", from);
    console.log("Spender:", account.address);
    console.log("Amount:", amount);
    console.log("Deadline:", deadline);

    // Step 1: Execute permit to allow sponsor to spend tokens
    const permitHash = await walletClient.writeContract({
      address: CHANCHIS_TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "permit",
      args: [
        from as `0x${string}`,
        account.address,
        BigInt(amount),
        BigInt(deadline),
        Number(v),
        r,
        s,
      ],
    });

    console.log("Permit tx hash:", permitHash);

    // Wait for permit transaction to be confirmed
    const permitReceipt = await publicClient.waitForTransactionReceipt({
      hash: permitHash,
    });

    if (permitReceipt.status !== "success") {
      return NextResponse.json(
        { error: "Permit transaction failed" },
        { status: 500 }
      );
    }

    console.log("Permit confirmed, executing transferFrom...");

    // Step 2: Execute transferFrom
    const transferHash = await walletClient.writeContract({
      address: CHANCHIS_TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "transferFrom",
      args: [
        from as `0x${string}`,
        to as `0x${string}`,
        BigInt(amount),
      ],
    });

    console.log("Transfer tx hash:", transferHash);

    // Wait for transfer transaction to be confirmed
    const transferReceipt = await publicClient.waitForTransactionReceipt({
      hash: transferHash,
    });

    if (transferReceipt.status !== "success") {
      return NextResponse.json(
        { error: "Transfer transaction failed" },
        { status: 500 }
      );
    }

    console.log("Transfer confirmed!");

    return NextResponse.json({
      success: true,
      permitTxHash: permitHash,
      transferTxHash: transferHash,
    });
  } catch (error: any) {
    console.error("Transfer API error:", error);
    return NextResponse.json(
      { error: error.message || "Transfer failed" },
      { status: 500 }
    );
  }
}
