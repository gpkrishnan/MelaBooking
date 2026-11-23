"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate as globalMutate } from "swr";
import { photoIdKey } from "@/components/PhotoIdBadge";
import fetcher from "@/db/fetcher";
import { Button } from "@/components/ui/button";

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const token = () => (typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "");

// Upload / view the Aadhaar card image a devotee sent on WhatsApp. Stored server-side, filed by Aadhaar number.
export default function AadhaarImage({ aadhaar }) {
    const digits = String(aadhaar || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
    const valid = digits.length >= 6;
    const [info, setInfo] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        try {
            setInfo(await fetcher(`data/aadhaar_info.php?aadhaar=${digits}&t=${token()}`, { auth: true }));
        } catch (e) {
            setInfo({ found: false, error: e.status === 401 ? "Session expired - log in again" : "Could not check" });
        }
    };
    useEffect(() => {
        if (valid) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digits]);

    const upload = async (file, replace) => {
        if (!file) return;
        setBusy(true);
        const fd = new FormData();
        fd.append("aadhaar", digits);
        fd.append("t", token()); // fallback in case the host strips the Authorization header
        fd.append("file", file);
        if (replace) fd.append("replace", "1");
        try {
            const res = await fetch(BASE + "actions/upload_aadhaar.php", { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: fd });
            const data = await res.json();
            if (data.success) toast.success("Photo ID image saved");
            else toast.error(data.message || "Upload failed");
        } catch (e) {
            toast.error("Upload failed");
        }
        setBusy(false);
        load();
        globalMutate(photoIdKey(digits)); // refresh the status chip in the member list
    };

    if (!valid) return <div className="text-xs text-gray-500">Enter the photo ID / Aadhaar number to upload its image.</div>;
    return (
        <div className="text-sm flex flex-wrap items-center gap-2 border rounded p-2">
            <span className="font-medium">Photo ID image:</span>
            {valid && info?.found ? (
                <>
                    <span className="text-green-700">stored (…{info.last4})</span>
                    <a className="underline text-blue-700" target="_blank" rel="noreferrer" href={`${BASE}data/aadhaar_image.php?doc_id=${info.doc_id}&t=${token()}`}>View</a>
                    <label className="underline cursor-pointer text-gray-700">
                        Replace
                        <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files[0], true)} />
                    </label>
                </>
            ) : (
                <>
                    <span className="text-gray-500">{info?.error || "not uploaded"}</span>
                    <label className="underline cursor-pointer text-blue-700">
                        Upload
                        <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files[0], false)} />
                    </label>
                </>
            )}
        </div>
    );
}
