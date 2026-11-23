"use client";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import fetcher from "@/db/fetcher";
import WithAuth from "@/components/WithAuth";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import BookingForm from "@/components/bookingform";

const TYPE = { ADD: "Add person", DELETE: "Remove person", OTHER: "Other" };

const ChangeRequestsContent = () => {
    const { data, error, mutate } = useSWR("data/change_requests.php", (u) => fetcher(u, { auth: true }));
    const [showDone, setShowDone] = useState(false);
    const [editingFamilyId, setEditingFamilyId] = useState(0);

    const setDone = async (id, done) => {
        const r = await fetcher("actions/resolve_change_request.php", { method: "POST", data: { id, done }, auth: true });
        if (r.success) mutate();
        else toast.error("Could not update");
    };

    if (error) return <div className="p-4 text-red-600">{error.status === 401 ? "Session expired - please log out and log in again." : "Error loading"}</div>;
    const rows = (data?.data || []).filter((r) => showDone || r.status === "O");
    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold">Change requests ({data?.open ?? 0} open)</h1>
                <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> show completed
                </label>
            </div>
            <p className="text-sm text-gray-600 mb-3">Devotees whose booking is already processed can only request additions/removals. Open the booking with the edit button, make the change, then mark it done. Inform the devotee from the booking form (amount may change).</p>
            <div className="overflow-auto border rounded">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Ref</th>
                            <th className="p-2 text-left">Name / WhatsApp</th>
                            <th className="p-2 text-left">Request</th>
                            <th className="p-2 text-left">Received</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className={"border-t " + (r.status === "D" ? "opacity-60" : "")}>
                                <td className="p-2 whitespace-nowrap">{r.ref}{r.mela_regn_id ? <div className="text-xs text-gray-500">Booking #{r.mela_regn_id}</div> : null}</td>
                                <td className="p-2">{r.name}<div className="text-xs text-gray-500">{r.whatsapp}</div></td>
                                <td className="p-2"><b>{TYPE[r.type] || r.type}</b><div className="whitespace-pre-wrap">{r.details}</div></td>
                                <td className="p-2 whitespace-nowrap text-xs">{r.created_at}</td>
                                <td className="p-2 whitespace-nowrap">
                                    {r.mela_regn_id ? (
                                        <Button size="sm" onClick={() => setEditingFamilyId(Number(r.mela_regn_id))} className="bg-green-600 hover:bg-green-700 text-white mr-3">
                                            <Pencil className="w-4 h-4 mr-2" />
                                            {r.mela_regn_id}
                                        </Button>
                                    ) : null}
                                    {r.status === "O" ? <Button size="sm" onClick={() => setDone(r.id, true)}>Mark done</Button> : <Button size="sm" variant="outline" onClick={() => setDone(r.id, false)}>Reopen</Button>}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No change requests</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingFamilyId > 0 && (
                <BookingForm
                    open={true}
                    familyId={editingFamilyId}
                    onSave={() => {
                        setEditingFamilyId(0);
                        mutate();
                    }}
                    onCancel={() => setEditingFamilyId(0)}
                />
            )}
        </div>
    );
};

export default function ChangeRequestsPage() {
    return (
        <WithAuth>
            <ChangeRequestsContent />
        </WithAuth>
    );
}
