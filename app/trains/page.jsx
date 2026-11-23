"use client";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import fetcher from "@/db/fetcher";
import WithAuth from "@/components/WithAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const blank = { id: 0, direction: "ONWARD", train_no: "", train_name: "", station: "SOLAPUR", travel_date: "", time_text: "", pickup_arranged: 0, active: 1 };

const TrainsContent = () => {
    const { data, error, mutate } = useSWR("data/trains.php", (u) => fetcher(u, { auth: true }));
    const [form, setForm] = useState(blank);
    const [filter, setFilter] = useState("ALL");
    const ch = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = async (t = form) => {
        const r = await fetcher("actions/save_train.php", { method: "POST", data: t, auth: true });
        if (r.success) {
            toast.success("Saved");
            setForm(blank);
            mutate();
        } else toast.error(r.message || "Could not save");
    };

    if (error) return <div className="p-4 text-red-600">{error.status === 401 ? "Session expired - please log out and log in again." : "Error loading"}</div>;
    const rows = (data?.data || []).filter((t) => filter === "ALL" || t.direction === filter);
    const sel = "border rounded h-9 px-2 text-sm";
    return (
        <div className="p-4">
            <h1 className="text-lg font-bold mb-1">Train list for the pre-registration form</h1>
            <p className="text-sm text-gray-600 mb-3">Devotees choose onward / return trains from this list (opens 4 Dec 2026, 8 AM). Tick <b>Pick-up arranged</b> only for trains with Solapur-Pandharpur bus pick-up/drop; other trains show &quot;pick-up not arranged&quot;.</p>
            <div className="border rounded p-3 mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                <label className="text-xs">Direction<select className={sel + " w-full"} value={form.direction} onChange={(e) => ch("direction", e.target.value)}><option value="ONWARD">Onward</option><option value="RETURN">Return</option></select></label>
                <label className="text-xs">Train no.<Input value={form.train_no} onChange={(e) => ch("train_no", e.target.value)} /></label>
                <label className="text-xs">Name<Input value={form.train_name} onChange={(e) => ch("train_name", e.target.value)} /></label>
                <label className="text-xs">Station<select className={sel + " w-full"} value={form.station} onChange={(e) => ch("station", e.target.value)}><option value="SOLAPUR">Solapur</option><option value="PANDHARPUR">Pandharpur</option></select></label>
                <label className="text-xs">Date<Input type="date" value={form.travel_date || ""} onChange={(e) => ch("travel_date", e.target.value)} /></label>
                <label className="text-xs">Time (text)<Input value={form.time_text} onChange={(e) => ch("time_text", e.target.value)} placeholder="06:10" /></label>
                <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!form.pickup_arranged} onChange={(e) => ch("pickup_arranged", e.target.checked ? 1 : 0)} /> Pick-up arranged</label>
                <div className="flex gap-2"><Button onClick={() => save()}>{form.id ? "Update" : "Add train"}</Button>{form.id ? <Button variant="outline" onClick={() => setForm(blank)}>Cancel</Button> : null}</div>
            </div>
            <div className="mb-2 text-sm">Show: {["ALL", "ONWARD", "RETURN"].map((f) => <button key={f} className={"px-2 py-1 mr-1 rounded border " + (filter === f ? "bg-gray-800 text-white" : "")} onClick={() => setFilter(f)}>{f}</button>)}</div>
            <div className="overflow-auto border rounded">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="p-2 text-left">Dir</th><th className="p-2 text-left">Train</th><th className="p-2 text-left">Station</th><th className="p-2 text-left">When</th><th className="p-2">Pick-up</th><th className="p-2">Active</th><th></th></tr></thead>
                    <tbody>
                        {rows.map((t) => (
                            <tr key={t.id} className={"border-t " + (t.active ? "" : "opacity-50")}>
                                <td className="p-2">{t.direction}</td>
                                <td className="p-2">{t.train_no} {t.train_name}</td>
                                <td className="p-2">{t.station}</td>
                                <td className="p-2">{t.travel_date} {t.time_text}</td>
                                <td className="p-2 text-center">{t.pickup_arranged ? "Yes" : "-"}</td>
                                <td className="p-2 text-center"><input type="checkbox" checked={!!t.active} onChange={(e) => save({ ...t, active: e.target.checked ? 1 : 0 })} /></td>
                                <td className="p-2"><Button size="sm" variant="outline" onClick={() => setForm({ ...t })}>Edit</Button></td>
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-gray-500">No trains yet</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function TrainsPage() {
    return (
        <WithAuth>
            <TrainsContent />
        </WithAuth>
    );
}
