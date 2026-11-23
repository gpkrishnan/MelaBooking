"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import fetcher from "@/db/fetcher";
import WithAuth from "@/components/WithAuth";

// ── Formatting helpers (ported from KKCRT/receipt-whatsapp/app.js) ──

function formatINR(num) {
    num = parseFloat(num);
    if (isNaN(num)) return "0";
    const parts = num.toFixed(2).split(".");
    let intPart = parts[0];
    const decPart = parts[1];
    const lastThree = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const formatted =
        rest.length > 0
            ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
            : lastThree;
    return formatted + "." + decPart;
}

function numberToWords(n) {
    if (n === 0) return "Zero";
    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertGroup(num) {
        if (num === 0) return "";
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
        return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + convertGroup(num % 100) : "");
    }

    const num = Math.floor(n);
    if (num === 0) return "Zero";
    let result = "";
    const crore = Math.floor(num / 10000000);
    const rem1 = num % 10000000;
    const lakh = Math.floor(rem1 / 100000);
    const rem2 = rem1 % 100000;
    const thousand = Math.floor(rem2 / 1000);
    const rem3 = rem2 % 1000;
    if (crore > 0) result += convertGroup(crore) + " Crore ";
    if (lakh > 0) result += convertGroup(lakh) + " Lakh ";
    if (thousand > 0) result += convertGroup(thousand) + " Thousand ";
    if (rem3 > 0) result += convertGroup(rem3);
    return result.trim();
}

function formatDateDMY(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function buildWhatsAppMessage(result) {
    let msg = "*KRISHNA KUDUMBAM CHARITABLE AND RELIGIOUS TRUST*\n";
    msg += "━━━━━━━━━━━━━━━━━━━━\n";
    msg += "*RECEIPT*\n\n";
    msg += `No.: *${result.receipt_no}*\n`;
    msg += `Date: *${formatDateDMY(result.receipt_date)}*\n\n`;
    msg += "Received with thanks a total sum of\n";
    msg += `*Rs. ${formatINR(result.amount)}/-*\n`;
    msg += `( Rupees ${numberToWords(parseFloat(result.amount))} Only )\n\n`;
    msg += `Towards: *${result.paymentdetails || "Room Booking - Ayodhya Mela 2026"}*\n\n`;
    msg += "From:\n";
    (result.members || []).forEach((m, i) => {
        msg += `${i + 1}) ${m.name}`;
        if (m.photoidno) msg += ` (PAN: ${m.photoidno})`;
        if (m.address) msg += `\n   ${m.address}`;
        msg += "\n";
    });
    msg += "\n━━━━━━━━━━━━━━━━━━━━\n";
    msg += "System Generated. Signature not Required.\n";
    msg += "_CHAIRMAN CUM MANAGING TRUSTEE / TRUSTEE_\n";
    msg += "\n_Hare Rama Hare Rama Rama Rama Hare Hare_\n_Hare Krishna Hare Krishna Krishna Krishna Hare Hare_";
    return msg;
}

function openWhatsApp(result) {
    const msg = buildWhatsAppMessage(result);
    const encoded = encodeURIComponent(msg);
    const phone = result.whatsapp ? String(result.whatsapp).replace(/\D/g, "") : "";
    const fullPhone = phone.length === 10 ? "91" + phone : phone;
    const url = fullPhone
        ? `https://wa.me/${fullPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
}

// ── Main Page Component ──

const ReceiptsContent = () => {
    const { data, error, isLoading, mutate } = useSWR("data/members_full_list.php", (url) =>
        fetcher(url, { method: "GET" })
    );

    const [selectedBrnIds, setSelectedBrnIds] = useState(new Set());
    const hasInitialized = useRef(false);
    const [isPosting, setIsPosting] = useState(false);
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [postError, setPostError] = useState("");

    // Families with recd_amount > 0 (eligible for receipt posting)
    const eligible = useMemo(() => {
        if (!data) return [];
        return data.filter((f) => f.recd > 0 && f.brnid);
    }, [data]);

    // Default all eligible checked on first data load
    useEffect(() => {
        if (eligible.length > 0 && !hasInitialized.current) {
            setSelectedBrnIds(new Set(eligible.map((f) => f.brnid)));
            hasInitialized.current = true;
        }
    }, [eligible]);

    const toggleOne = (brnid) => {
        setSelectedBrnIds((prev) => {
            const next = new Set(prev);
            next.has(brnid) ? next.delete(brnid) : next.add(brnid);
            return next;
        });
    };

    const selectAll = () => setSelectedBrnIds(new Set(eligible.map((f) => f.brnid)));
    const deselectAll = () => setSelectedBrnIds(new Set());

    const handlePost = async () => {
        if (selectedBrnIds.size === 0) return;
        setIsPosting(true);
        setPostError("");
        setShowResults(false);
        try {
            const res = await fetch(
                process.env.NEXT_PUBLIC_BACKEND_API_URL + "actions/bulk_post_receipts.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ brnids: Array.from(selectedBrnIds) }),
                }
            );
            const json = await res.json();
            if (json.status === "OK") {
                setResults(json.results || []);
                setShowResults(true);
                mutate(); // refresh booking data so RECEIPT_NO updates everywhere
            } else {
                setPostError(json.error || "Server error");
            }
        } catch (e) {
            setPostError("Network error: " + e.message);
        } finally {
            setIsPosting(false);
        }
    };

    // Result summary counts
    const created  = results.filter((r) => r.status === "created").length;
    const updated  = results.filter((r) => r.status === "updated").length;
    const errored  = results.filter((r) => r.status === "error").length;

    return (
        <div className="w-full bg-gray-100 min-h-screen">
            {/* ── Sticky Header ── */}
            <div className="px-2 py-1 sm:py-2 sticky top-0 sm:top-10 z-20 bg-linear-to-r from-amber-300 to-green-700 flex flex-wrap items-center justify-between gap-2 text-white rounded-t font-bold text-xs sm:text-base">
                <div className="whitespace-nowrap">Receipts</div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded">
                        {selectedBrnIds.size} / {eligible.length} selected
                    </span>
                    <button
                        onClick={selectAll}
                        className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-0.5 rounded border border-white/40"
                    >
                        Select All
                    </button>
                    <button
                        onClick={deselectAll}
                        className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-0.5 rounded border border-white/40"
                    >
                        Deselect All
                    </button>
                    <button
                        onClick={handlePost}
                        disabled={isPosting || selectedBrnIds.size === 0}
                        className="bg-white text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs sm:text-sm px-3 py-1 rounded shadow"
                    >
                        {isPosting ? "Posting..." : `Post ${selectedBrnIds.size} Receipt${selectedBrnIds.size !== 1 ? "s" : ""}`}
                    </button>
                </div>
            </div>

            {/* ── Loading / Error ── */}
            {isLoading && <div className="p-4 text-sm text-gray-500">Loading bookings...</div>}
            {error && <div className="p-4 text-sm text-red-500">Error loading data</div>}
            {postError && (
                <div className="mx-2 mt-2 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                    {postError}
                </div>
            )}

            {/* ── Results Section ── */}
            {showResults && (
                <div className="mx-2 mt-3 bg-white rounded shadow p-2 sm:p-4">
                    <div className="flex items-center gap-3 mb-3 text-xs sm:text-sm font-semibold flex-wrap">
                        <span className="text-gray-700">Posting Results:</span>
                        {created > 0 && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">{created} Created</span>}
                        {updated > 0 && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{updated} Updated</span>}
                        {errored > 0 && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">{errored} Errors</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[10px] sm:text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-left">
                                    <th className="px-2 py-1 border">#</th>
                                    <th className="px-2 py-1 border">Leader</th>
                                    <th className="px-2 py-1 border">Group No</th>
                                    <th className="px-2 py-1 border">Amount</th>
                                    <th className="px-2 py-1 border">Receipt No</th>
                                    <th className="px-2 py-1 border">Rcpt Date</th>
                                    <th className="px-2 py-1 border">Status</th>
                                    <th className="px-2 py-1 border">WhatsApp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, idx) => {
                                    const rowBg =
                                        r.status === "created"
                                            ? "bg-green-50"
                                            : r.status === "updated"
                                            ? "bg-blue-50"
                                            : "bg-red-50";
                                    // Find matching eligible family for groupNo
                                    const fam = eligible.find((f) => f.brnid === r.brnid);
                                    return (
                                        <tr key={r.brnid} className={rowBg}>
                                            <td className="px-2 py-1 border text-center">{idx + 1}</td>
                                            <td className="px-2 py-1 border">{r.leader}</td>
                                            <td className="px-2 py-1 border font-mono text-[9px] sm:text-[10px]">
                                                {fam?.groupNo || ""}
                                            </td>
                                            <td className="px-2 py-1 border text-right whitespace-nowrap">
                                                ₹{formatINR(r.amount)}
                                            </td>
                                            <td className="px-2 py-1 border font-mono font-semibold">
                                                {r.receipt_no || "-"}
                                            </td>
                                            <td className="px-2 py-1 border whitespace-nowrap">
                                                {formatDateDMY(r.receipt_date)}
                                            </td>
                                            <td className="px-2 py-1 border">
                                                {r.status === "created" && (
                                                    <span className="bg-green-600 text-white px-1 rounded text-[9px]">Created</span>
                                                )}
                                                {r.status === "updated" && (
                                                    <span className="bg-blue-600 text-white px-1 rounded text-[9px]">Updated</span>
                                                )}
                                                {r.status === "error" && (
                                                    <span className="bg-red-600 text-white px-1 rounded text-[9px]" title={r.error_msg}>
                                                        Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 border text-center">
                                                {r.receipt_no && (
                                                    <button
                                                        onClick={() => openWhatsApp(r)}
                                                        className="bg-green-500 hover:bg-green-600 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded"
                                                    >
                                                        WA
                                                    </button>
                                                )}
                                                {r.status === "error" && (
                                                    <span className="text-red-600 text-[9px]" title={r.error_msg}>
                                                        {r.error_msg}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Booking List ── */}
            {!isLoading && !error && (
                <div className="mx-2 mt-3">
                    {eligible.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No bookings with received payments found.
                        </div>
                    ) : (
                        <div className="bg-white rounded shadow overflow-hidden">
                            <table className="w-full text-[10px] sm:text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-left text-[10px] sm:text-xs">
                                        <th className="px-2 py-1.5 border-b w-6 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrnIds.size === eligible.length && eligible.length > 0}
                                                onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                                                className="cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-2 py-1.5 border-b">Family / Group</th>
                                        <th className="px-2 py-1.5 border-b hidden sm:table-cell">City</th>
                                        <th className="px-2 py-1.5 border-b text-right">Amount</th>
                                        <th className="px-2 py-1.5 border-b hidden sm:table-cell">Rcpt Date</th>
                                        <th className="px-2 py-1.5 border-b hidden md:table-cell">Payment Ref</th>
                                        <th className="px-2 py-1.5 border-b">Receipt No</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eligible.map((fmly, idx) => {
                                        const isChecked = selectedBrnIds.has(fmly.brnid);
                                        const hasReceipt = !!fmly.RECEIPT_NO;
                                        return (
                                            <tr
                                                key={fmly.brnid}
                                                className={`border-b hover:bg-gray-50 cursor-pointer ${
                                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                                } ${isChecked ? "" : "opacity-50"}`}
                                                onClick={() => toggleOne(fmly.brnid)}
                                            >
                                                <td
                                                    className="px-2 py-1.5 text-center"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleOne(fmly.brnid)}
                                                        className="cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <div className="font-semibold">{fmly.leader}</div>
                                                    <div className="text-[9px] text-gray-500 font-mono">{fmly.groupNo}</div>
                                                </td>
                                                <td className="px-2 py-1.5 hidden sm:table-cell text-gray-600">
                                                    {fmly.city}
                                                </td>
                                                <td className="px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                                                    ₹{formatINR(fmly.recd)}
                                                </td>
                                                <td className="px-2 py-1.5 hidden sm:table-cell text-gray-600 whitespace-nowrap">
                                                    {formatDateDMY(fmly.receipt_date)}
                                                </td>
                                                <td className="px-2 py-1.5 hidden md:table-cell text-gray-500 max-w-[150px] truncate">
                                                    {fmly.paymentdetails}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    {hasReceipt ? (
                                                        <span className="bg-green-100 text-green-800 border border-green-300 font-mono font-semibold px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] whitespace-nowrap">
                                                            {fmly.RECEIPT_NO}
                                                        </span>
                                                    ) : (
                                                        <span className="bg-orange-100 text-orange-700 border border-orange-300 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="px-3 py-2 text-[10px] text-gray-500 bg-gray-50 border-t">
                                {eligible.length} booking{eligible.length !== 1 ? "s" : ""} with payment &bull;{" "}
                                {eligible.filter((f) => f.RECEIPT_NO).length} receipted &bull;{" "}
                                {eligible.filter((f) => !f.RECEIPT_NO).length} pending
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ReceiptsPage = () => (
    <WithAuth>
        <ReceiptsContent />
    </WithAuth>
);

export default ReceiptsPage;
