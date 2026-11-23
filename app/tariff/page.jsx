"use client";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import fetcher from "@/db/fetcher";
import WithAuth from "@/components/WithAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OCC = [2, 3, 4];

const TariffContent = () => {
    const { data, error, mutate } = useSWR("data/tariff.php", (u) => fetcher(u, { auth: true }));
    const [edits, setEdits] = useState({ AC: {}, NAC: {} });
    const [saving, setSaving] = useState(false);
    const base = data?.rates || { AC: {}, NAC: {} };
    const rates = { AC: { ...base.AC, ...edits.AC }, NAC: { ...base.NAC, ...edits.NAC } };

    const set = (type, n, v) => setEdits((r) => ({ ...r, [type]: { ...r[type], [n]: v } }));

    const save = async () => {
        setSaving(true);
        try {
            const r = await fetcher("actions/save_tariff.php", { method: "POST", data: { rates }, auth: true });
            if (r.success) {
                toast.success("Tariff saved. New estimates use these rates; saved estimates are unchanged.");
                setEdits({ AC: {}, NAC: {} });
                mutate();
            } else toast.error(r.message || "Could not save");
        } catch (e) {
            toast.error(e.status === 401 ? "Session expired - please log in again" : "Could not save");
        }
        setSaving(false);
    };

    if (error) return <div className="p-4 text-red-600">{error.status === 401 ? "Session expired - please log out and log in again." : "Error loading tariff"}</div>;
    return (
        <div className="p-4 max-w-xl">
            <h1 className="text-lg font-bold mb-1">Tariff (Rs. per person)</h1>
            <p className="text-sm text-gray-600 mb-4">Shown to devotees in the pre-registration form as an approximate estimate. A room with a single person has no rate (devotee is asked to contact the Trust).</p>
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border text-left"></th>
                        {OCC.map((n) => (
                            <th key={n} className="p-2 border">{n} persons / room</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {["AC", "NAC"].map((t) => (
                        <tr key={t}>
                            <th className="p-2 border text-left">{t === "AC" ? "AC" : "Non-AC"}</th>
                            {OCC.map((n) => (
                                <td key={n} className="p-1 border">
                                    <Input type="number" min="1" value={rates[t]?.[n] ?? ""} onChange={(e) => set(t, n, e.target.value)} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <Button className="mt-4" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save tariff"}</Button>
        </div>
    );
};

export default function TariffPage() {
    return (
        <WithAuth>
            <TariffContent />
        </WithAuth>
    );
}
