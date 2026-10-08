import { RpcError, row, type BasicReport, type FactRow } from "./types";

const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

type RpcResult<T> = { result?: T; error?: { code?: number; message?: string } };

type ParsedMint = {
  value: {
    owner: string;
    data: {
      parsed?: {
        type?: string;
        info?: {
          decimals?: number;
          supply?: string;
          mintAuthority?: string | null;
          freezeAuthority?: string | null;
        };
      };
    };
  } | null;
};

type Largest = {
  value: Array<{ address: string; amount: string; uiAmountString?: string | null }>;
};

function endpoint(): string {
  return process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      cache: "no-store",
    });
  } catch {
    throw new RpcError("Solana RPC unreachable", 502);
  }

  if (response.status === 429) throw new RpcError("Solana RPC rate limited", 429);

  const body = (await response.json()) as RpcResult<T>;
  if (body.error) {
    const message = body.error.message || "Solana RPC error";
    const status = /rate|429|too many/i.test(message) ? 429 : 502;
    throw new RpcError(message, status);
  }
  return body.result as T;
}

function authorityRow(field: string, value: string | null | undefined): FactRow {
  if (!value) return row(field, "revoked", "green");
  return row(field, value, "red");
}

function formatSupply(raw: string, decimals: number): string {
  if (!/^\d+$/.test(raw)) return raw;
  const whole = raw.padStart(decimals + 1, "0");
  const cut = whole.length - decimals;
  const integer = whole.slice(0, cut).replace(/^0+(?=\d)/, "") || "0";
  const fraction = decimals > 0 ? whole.slice(cut).replace(/0+$/, "") : "";
  return fraction ? `${integer}.${fraction}` : integer;
}

export function isSolanaAddress(address: string): boolean {
  return MINT_RE.test(address);
}

export async function readSolana(address: string): Promise<BasicReport> {
  if (!isSolanaAddress(address)) {
    throw new RpcError("Not a Solana address", 400);
  }

  const account = await rpc<ParsedMint>("getAccountInfo", [address, { encoding: "jsonParsed" }]);
  if (!account.value) throw new RpcError("Account not found", 404);

  const parsed = account.value.data.parsed;
  if (!parsed?.info || parsed.type !== "mint") {
    throw new RpcError("Account is not a mint", 400);
  }

  const info = parsed.info;
  const decimals = info.decimals ?? 0;
  const supply = info.supply ?? "0";
  const rows: FactRow[] = [
    row("Address", address),
    row("Program", account.value.owner),
    row("Decimals", String(decimals)),
    row("Supply", formatSupply(supply, decimals)),
    row("Raw supply", supply),
    authorityRow("Mint authority", info.mintAuthority),
    authorityRow("Freeze authority", info.freezeAuthority),
  ];

  const largest = await rpc<Largest>("getTokenLargestAccounts", [address]);
  const holders = largest.value ?? [];
  if (holders.length === 0) {
    rows.push(row("Top holders", "none returned"));
  } else {
    holders.slice(0, 10).forEach((holder, index) => {
      const amount = holder.uiAmountString ?? holder.amount;
      rows.push(row(`Holder ${index + 1}`, `${holder.address} · ${amount}`));
    });
  }

  return {
    chain: "solana",
    address,
    cached: false,
    fetchedAt: new Date().toISOString(),
    rows,
  };
}
