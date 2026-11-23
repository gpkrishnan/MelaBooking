"use client";
import { useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/db/fetcher";
import WithAuth from "@/components/WithAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const LABEL = { submitted: "Submitted", pending: "Pending", none: "No ID number" };
const CHIP = { submitted: "bg-green-100 text-green-700", pending: "bg-red-100 text-red-700", none: "bg-gray-100 text-gray-600" };
const FILTERS = [
    ["all", "All"],
    ["pending", "Pending"],
    ["none", "No ID number"],
    ["submitted", "Submitted"],
];

const PhotoIdReportContent = () => {
    const { data, error, isLoading } = useSWR("data/photoid_report.php", (u) => fetcher(u, { auth: true }));
    const [filter, setFilter] = useState("pending");
    const [q, setQ] = useState("");

    const rows = useMemo(() => {
        const s = q.trim().toLowerCase();
        return (data?.rows || []).filter((r) => (filter === "all" || r.state === filter) && (!s || [r.name, r.leader, r.phone, r.groupNo].some((v) => String(v || "").toLowerCase().includes(s))));
    }, [data, filter, q]);

    const exportCsv = () => {
        const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const lines = [["Group No", "Group head", "Name", "Age", "Sex", "Phone", "Photo ID (last 4)", "Status"].map(esc).join(",")];
        rows.forEach((r) => lines.push([r.groupNo, r.leader, r.name, r.age, r.sex, r.phone, r.last4, LABEL[r.state]].map(esc).join(",")));
        const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `photo-id-${filter}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (error) return <div className="p-4 text-red-600">{error.status === 401 ? "Session expired - please log out and log in again." : "Error loading"}</div>;
    if (isLoading || !data) return <div className="p-4">Loading...</div>;
    const c = data.counts;
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";

    return (
        <div className="p-4">
            <h1 className="text-lg font-bold mb-2">Photo ID report</h1>
            <div className="flex flex-wrap gap-2 text-sm mb-3">
                <span className="px-2 py-1 rounded bg-gray-100">Total members: <b>{c.total}</b></span>
                <span className="px-2 py-1 rounded bg-green-100 text-green-700">Submitted: <b>{c.submitted}</b></span>
                <span className="px-2 py-1 rounded bg-red-100 text-red-700">Pending: <b>{c.pending}</b></span>
                <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">No ID number: <b>{c.none}</b></span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {FILTERS.map(([k, label]) => (
                    <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
                        {label}
                    </Button>
                ))}
                <Input className="w-56 h-8" placeholder="Search name / phone / group" value={q} onChange={(e) => setQ(e.target.value)} />
                <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows.length}>
                    Export CSV ({rows.length})
                </Button>
            </div>
            <div className="text-xs text-gray-500 mb-2">Cancelled bookings are not listed.</div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>ID (last 4)</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((r, i) => (
                        <TableRow key={r.memberid}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="whitespace-nowrap">{r.groupNo}<div className="text-xs text-gray-500">{r.leader}</div></TableCell>
                            <TableCell>{r.name} <span className="text-xs text-gray-500">({r.age}, {r.sex})</span></TableCell>
                            <TableCell>{r.phone || "-"}</TableCell>
                            <TableCell>{r.last4 ? `…${r.last4}` : "-"}</TableCell>
                            <TableCell>
                                <span className={`text-xs px-2 py-0.5 rounded ${CHIP[r.state]}`}>{LABEL[r.state]}</span>
                                {r.doc_id && (
                                    <a className="ml-2 text-xs underline text-blue-700" target="_blank" rel="noreferrer" href={`${BASE}data/aadhaar_image.php?doc_id=${r.doc_id}&t=${token}`}>
                                        View
                                    </a>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {!rows.length && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-gray-500">Nothing to show</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default function PhotoIdReportPage() {
    return (
        <WithAuth>
            <PhotoIdReportContent />
        </WithAuth>
    );
}
