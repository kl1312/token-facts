import { RpcError, row, type BasicReport, type Chain, type FactRow } from "./types";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const ZERO = "0x0000000000000000000000000000000000000000";

const SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  owner: "0x8da5cb5b",
} as const;

type RpcResult = { result?: string; error?: { code?: number; message?: string } };

function endpoint(chain: Chain): string {
  if (chain === "bsc") return process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
  return process.env.ETH_RPC_URL || "https://ethereum.publicnode.com";
}

async function ethCall(chain: Chain, to: string, data: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(endpoint(chain), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to, data }, "latest"],
      }),
      cache: "no-store",
    });
  } catch {
    throw new RpcError(`${chain} RPC unreachable`, 502);
  }

  if (response.status === 429) throw new RpcError(`${chain} RPC rate limited`, 429);

  const body = (await response.json()) as RpcResult;
  if (body.error) {
    const message = body.error.message || `${chain} RPC error`;
    if (/revert|execution/i.test(message)) return null;
    const status = /rate|429|too many|limit/i.test(message) ? 429 : 502;
    throw new RpcError(message, status);
  }
  if (!body.result || body.result === "0x") return null;
  return body.result;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function decodeString(result: string | null): string | null {
  if (!result) return null;
  const clean = result.slice(2);
  if (clean.length === 0) return null;
  if (clean.length === 64) {
    const text = new TextDecoder().decode(hexToBytes(clean)).replace(/\u0000/g, "").trim();
    return text || null;
  }
  if (clean.length < 128) return null;
  const length = Number(BigInt(`0x${clean.slice(64, 128)}`));
  if (!Number.isFinite(length) || length < 0 || length > 256) return null;
  const data = clean.slice(128, 128 + length * 2);
  const text = new TextDecoder().decode(hexToBytes(data)).replace(/\u0000/g, "").trim();
  return text || null;
}

function decodeUint(result: string | null): bigint | null {
  if (!result || result === "0x") return null;
  try {
    return BigInt(result);
  } catch {
    return null;
  }
}

decodeAddress function missing placeholder
