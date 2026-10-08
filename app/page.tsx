"use client";

import { FormEvent, useState } from "react";

type Tone = "red" | "green" | "neutral";

type FactRow = {
  field: string;
  value: string;
  source: "on-chain";
  tone: Tone;
};

type Report = {
  chain: string;
  address: string;
  cached: boolean;
  fetchedAt: string;
  rows: FactRow[];
  stale?: boolean;
};

export default function Page() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("solana");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    const params = new URLSearchParams({ address: address.trim(), chain });
    try {
      const response = await fetch(`/api/basic?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Request failed");
      } else {
        setReport(body);
      }
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Token facts</h1>
      <p className="lede">
        Mint, supply, authority, owner, and top holders read from chain RPC. No score.
      </p>
      <form onSubmit={onSubmit}>
        <select value={chain} onChange={(event) => setChain(event.target.value)} aria-label="Chain">
          <option value="solana">Solana</option>
          <option value="ethereum">Ethereum</option>
          <option value="bsc">BSC</option>
        </select>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Mint or contract address"
          aria-label="Address"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button type="submit" disabled={loading || address.trim().length === 0}>
          {loading ? "Reading" : "Read"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {report ? (
        <>
          <p className="status">
            {report.chain} · {report.cached ? "cached" : "fresh"}
            {report.stale ? " · stale, RPC limited" : ""} · {report.fetchedAt}
          </p>
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((item, index) => (
                <tr key={`${item.field}-${index}`}>
                  <td>{item.field}</td>
                  <td className={item.tone === "neutral" ? undefined : `tone-${item.tone}`}>
                    {item.value}
                  </td>
                  <td>{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
      <p className="foot">
        Authority or owner set is red. Revoked, zero address, or no owner() is green. Cache is 5 minutes.
      </p>
    </main>
  );
}
