"use client";
import useSWR from "swr";
import fetcher from "@/db/fetcher";

const OCC = [2, 3, 4];

// Read-only tariff (Rs. per person) for quick reference; edited on the Tariff screen
const RateCard = () => {
    const { data, error } = useSWR("data/tariff.php", (u) => fetcher(u, { auth: true }));
    if (error || !data?.rates) return null;
    const rates = data.rates;
    const fmt = (v) => (v != null ? Number(v).toLocaleString("en-IN") : "-");

    return (
        <div className="border rounded p-2 text-sm">
            <div className="font-semibold mb-1">Rate card (Rs. per person)</div>
            <table className="w-full border text-center">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-1 border text-left"></th>
                        {OCC.map((n) => (
                            <th key={n} className="p-1 border">{n} per room</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[["AC", "AC"], ["NAC", "Non-AC"]].map(([key, label]) => (
                        <tr key={key}>
                            <th className="p-1 border text-left">{label}</th>
                            {OCC.map((n) => (
                                <td key={n} className="p-1 border">{fmt(rates[key]?.[n])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RateCard;
