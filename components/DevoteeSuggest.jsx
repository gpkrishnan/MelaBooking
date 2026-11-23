"use client";
import { useEffect, useState } from "react";
import fetcher from "@/db/fetcher";

// Looks up earlier-event records (devotee_master) by WhatsApp or Aadhaar and offers one-click fill.
// `by`: "whatsapp" | "aadhaar"; `value` the typed number; `onPick(person)` fills the form.
export default function DevoteeSuggest({ by, value, onPick }) {
    const [people, setPeople] = useState([]);
    const d = String(value || "").replace(by === "aadhaar" ? /[^0-9A-Za-z]/g : /\D/g, "");
    const ok = by === "aadhaar" ? d.length >= 6 : d.length >= 10;
    useEffect(() => {
        if (!ok) return;
        let alive = true;
        const timer = setTimeout(() => {
            fetcher(`data/devotee_lookup.php?${by}=${encodeURIComponent(value)}`, { auth: true })
                .then((r) => alive && setPeople(r.people || []))
                .catch(() => alive && setPeople([]));
        }, 400);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [by, value, ok]);

    if (!ok || !people.length) return null;
    return (
        <div className="mt-1 flex flex-wrap gap-1">
            {people.slice(0, 5).map((p, i) => (
                <button key={i} type="button" onClick={() => onPick(p)} className="text-xs rounded border border-amber-400 bg-amber-50 px-2 py-0.5 hover:bg-amber-100">
                    Earlier record: {p.name}
                    {p.city ? `, ${p.city}` : ""} — fill
                </button>
            ))}
        </div>
    );
}
