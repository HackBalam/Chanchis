import { NextRequest, NextResponse } from "next/server";

const CHANCHIS_TOKEN_ADDRESS = "0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418";
const CELO_CHAIN_ID = 42220;

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

    const thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY;
    const sponsorAddress = process.env.SPONSOR_WALLET_ADDRESS;

    if (!thirdwebSecretKey || !sponsorAddress) {
      return NextResponse.json(
        { error: "Server not configured properly" },
        { status: 500 }
      );
    }

    // Parse the signature to extract v, r, s
    const sig = signature.slice(2); // Remove '0x'
    const r = "0x" + sig.slice(0, 64);
    const s = "0x" + sig.slice(64, 128);
    const v = parseInt(sig.slice(128, 130), 16);

    // Step 1: Execute permit to allow sponsor to spend tokens
    const permitResponse = await fetch("https://api.thirdweb.com/v1/contracts/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": thirdwebSecretKey,
      },
      body: JSON.stringify({
        calls: [
          {
            contractAddress: CHANCHIS_TOKEN_ADDRESS,
            method:
              "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
            params: [from, sponsorAddress, amount, deadline, v, r, s],
          },
        ],
        chainId: CELO_CHAIN_ID,
        from: sponsorAddress,
      }),
    });

    const permitData = await permitResponse.json();

    if (!permitResponse.ok) {
      console.error("Permit error:", permitData);
      return NextResponse.json(
        { error: permitData.error || "Permit failed" },
        { status: 500 }
      );
    }

    // Step 2: Execute transferFrom
    const transferResponse = await fetch("https://api.thirdweb.com/v1/contracts/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": thirdwebSecretKey,
      },
      body: JSON.stringify({
        calls: [
          {
            contractAddress: CHANCHIS_TOKEN_ADDRESS,
            method:
              "function transferFrom(address from, address to, uint256 amount) returns (bool)",
            params: [from, to, amount],
          },
        ],
        chainId: CELO_CHAIN_ID,
        from: sponsorAddress,
      }),
    });

    const transferData = await transferResponse.json();

    if (!transferResponse.ok) {
      console.error("Transfer error:", transferData);
      return NextResponse.json(
        { error: transferData.error || "Transfer failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permitTxHash: permitData.transactionHash,
      transferTxHash: transferData.transactionHash,
    });
  } catch (error: any) {
    console.error("Transfer API error:", error);
    return NextResponse.json(
      { error: error.message || "Transfer failed" },
      { status: 500 }
    );
  }
}
