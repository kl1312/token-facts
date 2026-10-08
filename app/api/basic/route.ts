import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheGetStale, cacheKey, cacheSet } from "@/lib/cache";
import { isEvmAddress, readEvm } from "@/lib/evm";
import { isSolanaAddress, readSolana } from "@/lib/solana";
import { RpcError, type Chain } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseChain(value: string | null, address: string): Chain {
  if (value === "solana" || value === "ethereum" || value === "bsc") return value;
  if (isEvmAddress(address)) {
    throw new RpcError("Select ethereum or bsc for a 0x address", 400);
  }
  return "solana";
}

export async function GET(request: NextRequest) {
  const address = (request.nextUrl.searchParams.get("address") || "").trim();
  const chainParam = request.nextUrl.searchParams.get("chain");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  let chain: Chain;
  try {
    chain = parseChain(chainParam, address);
  } catch (error) {
    const message = error instanceof Error ? error.message : "bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (chain === "solana" && !isSolanaAddress(address)) {
    return NextResponse.json({ error: "Not a Solana address" }, { status: 400 });
  }
  if (chain !== "solana" && !isEvmAddress(address)) {
    return NextResponse.json({ error: "Not an EVM address" }, { status: 400 });
  }

  const key = cacheKey(chain, address);
  const hit = cacheGet(key);
  if (hit) return NextResponse.json({ ...hit, cached: true });

  try {
    const report = chain === "solana" ? await readSolana(address) : await readEvm(chain, address);
    cacheSet(key, report);
    return NextResponse.json(report);
  } catch (error) {
    const rpcError = error instanceof RpcError ? error : new RpcError("RPC failed", 502);
    if (rpcError.status === 429) {
      const stale = cacheGetStale(key);
      if (stale) return NextResponse.json({ ...stale, cached: true, stale: true });
    }
    return NextResponse.json({ error: rpcError.message }, { status: rpcError.status });
  }
}
