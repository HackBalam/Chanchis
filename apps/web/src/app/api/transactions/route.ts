import { NextRequest, NextResponse } from "next/server";

const CHANCHIS_TOKEN_ADDRESS = "0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418";
const CELO_CHAIN_ID = 42220;

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenDecimal: string;
  timeStamp: string;
  type: "in" | "out";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ETHERSCAN_API_KEY;

    if (!apiKey || apiKey === "build-time-placeholder") {
      return NextResponse.json(
        { error: "Etherscan API key not configured" },
        { status: 500 }
      );
    }

    // Etherscan API V2 - Token transfers
    const url = `https://api.etherscan.io/v2/api?chainid=${CELO_CHAIN_ID}&module=account&action=tokentx&contractaddress=${CHANCHIS_TOKEN_ADDRESS}&address=${address}&page=1&offset=50&sort=desc&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "1" || !data.result) {
      // No transactions found or error
      if (data.message === "No transactions found") {
        return NextResponse.json({ transactions: [] });
      }
      console.error("Etherscan API error:", data);
      return NextResponse.json({ transactions: [] });
    }

    // Format transactions
    const transactions: Transaction[] = data.result.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      tokenSymbol: tx.tokenSymbol || "CHNC",
      tokenDecimal: tx.tokenDecimal || "18",
      timeStamp: tx.timeStamp,
      type: tx.to.toLowerCase() === address.toLowerCase() ? "in" : "out",
    }));

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Transactions API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
