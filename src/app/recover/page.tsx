"use client";

import { useState, useEffect } from "react";

export default function RecoverPage() {
  const [status, setStatus] = useState("Loading...");
  const [localBills, setLocalBills] = useState<any[]>([]);
  const [vaultBills, setVaultBills] = useState<any[]>([]);
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [recoveredSnippets, setRecoveredSnippets] = useState<string[]>([]);

  useEffect(() => {
    try {
      // 1. List all localStorage keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      setAllKeys(keys);

      // 2. Read rajnandni_bills
      const rawBills = localStorage.getItem("rajnandni_bills");
      if (rawBills) {
        try {
          const parsed = JSON.parse(rawBills);
          setLocalBills(Array.isArray(parsed) ? parsed : []);
        } catch {}
      }

      // 3. Read vault
      const rawVault = localStorage.getItem("rajnandni_raw_bills_vault");
      if (rawVault) {
        try {
          const parsed = JSON.parse(rawVault);
          setVaultBills(Array.isArray(parsed) ? parsed : []);
        } catch {}
      }

      // 4. Search ALL localStorage keys for any bill-like data
      const snippets: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || "";
        if (val.includes("RJN-2026-") || val.includes("billNo") || val.includes("grandTotal")) {
          if (key !== "rajnandni_bills" && key !== "rajnandni_raw_bills_vault") {
            snippets.push(`[${key}] ${val.slice(0, 500)}`);
          }
        }
      }
      setRecoveredSnippets(snippets);

      setStatus("Scan complete!");
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
  }, []);

  const allBills = [...localBills];
  vaultBills.forEach(vb => {
    if (!allBills.some(b => b.billNo === vb.billNo)) {
      allBills.push(vb);
    }
  });

  // Sort by billNo descending
  allBills.sort((a, b) => {
    const seqA = parseInt((a.billNo || "").replace(/\D/g, "").slice(-4));
    const seqB = parseInt((b.billNo || "").replace(/\D/g, "").slice(-4));
    return seqB - seqA;
  });

  const handleExportJSON = () => {
    const data = JSON.stringify({ localBills, vaultBills, allKeys, recoveredSnippets, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rajnandni_recovery_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "1200px", margin: "0 auto", background: "#fff" }}>
      <h1 style={{ color: "#b45309", borderBottom: "3px solid #b45309", paddingBottom: "10px" }}>
        🔍 RAJNANDINI - Bill Recovery & Data Export
      </h1>

      <div style={{ background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: "8px", padding: "15px", marginBottom: "20px" }}>
        <strong>Status:</strong> {status}<br />
        <strong>LocalStorage Keys Found:</strong> {allKeys.length}<br />
        <strong>Bills in rajnandni_bills:</strong> {localBills.length}<br />
        <strong>Bills in Vault Backup:</strong> {vaultBills.length}<br />
        <strong>Total Unique Bills:</strong> {allBills.length}<br />
        <strong>Other keys with bill data:</strong> {recoveredSnippets.length}
      </div>

      <button
        onClick={handleExportJSON}
        style={{ background: "#16a34a", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginBottom: "20px" }}
      >
        📥 Download Full Recovery Data (JSON)
      </button>

      <h2 style={{ color: "#1e3a5f" }}>All Bills Found ({allBills.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#1e293b", color: "white" }}>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Bill No</th>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Customer</th>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Phone</th>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Items</th>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Total ₹</th>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Payment</th>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Date</th>
            <th style={{ padding: "8px", border: "1px solid #334155" }}>Source</th>
          </tr>
        </thead>
        <tbody>
          {allBills.map((b, i) => {
            const isVaultOnly = !localBills.some(lb => lb.billNo === b.billNo);
            return (
              <tr key={i} style={{ background: isVaultOnly ? "#fef9c3" : (i % 2 === 0 ? "#f8fafc" : "#fff") }}>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", fontWeight: "bold", fontFamily: "monospace" }}>{b.billNo}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{b.customer?.name || "—"}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{b.customer?.phone || "—"}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{b.items?.length || 0}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", fontWeight: "bold", textAlign: "right" }}>₹{(b.grandTotal || b.total || 0).toLocaleString("en-IN")}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{b.paymentMode || b.payment_mode || "—"}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", fontSize: "11px" }}>{b.createdAt || b.rawDate || "—"}</td>
                <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", fontSize: "11px" }}>{isVaultOnly ? "🔒 Vault" : "📋 Local"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {recoveredSnippets.length > 0 && (
        <>
          <h2 style={{ color: "#dc2626", marginTop: "30px" }}>Other Bill-Related Data Found</h2>
          {recoveredSnippets.map((s, i) => (
            <pre key={i} style={{ background: "#fef2f2", border: "1px solid #fca5a5", padding: "8px", borderRadius: "4px", fontSize: "11px", overflow: "auto", marginBottom: "8px" }}>
              {s}
            </pre>
          ))}
        </>
      )}

      <h2 style={{ color: "#1e3a5f", marginTop: "30px" }}>All LocalStorage Keys</h2>
      <ul style={{ fontSize: "12px", fontFamily: "monospace" }}>
        {allKeys.map((k, i) => (
          <li key={i}>{k} — {(localStorage.getItem(k) || "").length} chars</li>
        ))}
      </ul>
    </div>
  );
}
