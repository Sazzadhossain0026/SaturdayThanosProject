"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";

export function TimeAgo({ ts }: { ts: number }) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    // Intentional: compute the wall-clock-dependent label only after mount so
    // server and first client paint match exactly (both render "").
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(timeAgo(ts));
    const id = window.setInterval(() => setLabel(timeAgo(ts)), 30000);
    return () => window.clearInterval(id);
  }, [ts]);

  // Renders empty on server + first client paint, then fills in post-mount —
  // avoids any SSR/CSR text mismatch from wall-clock-dependent output.
  return <span>{label}</span>;
}
