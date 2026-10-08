export type Chain = "solana" | "ethereum" | "bsc";

export type Tone = "red" | "green" | "neutral";

export type FactRow = {
  field: string;
  value: string;
  source: "on-chain";
  tone: Tone;
};

export type BasicReport = {
  chain: Chain;
  address: string;
  cached: boolean;
  fetchedAt: string;
  rows: FactRow[];
};

export class RpcError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "RpcError";
    this.status = status;
  }
}

export function row(field: string, value: string, tone: Tone = "neutral"): FactRow {
  return { field, value, source: "on-chain", tone };
}
