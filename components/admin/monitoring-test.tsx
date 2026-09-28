"use client";

// TEMPORARY (M14-P01): verification buttons for Sentry delivery and scrubbing. Remove after testing.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { triggerTestServerError } from "@/lib/admin/actions";

export function MonitoringTest() {
  const [crash, setCrash] = useState(false);
  const [sent, setSent] = useState("");
  if (crash) throw new Error("M14 test browser error for test.customer@example.com with key re_FAKEFAKEFAKE1234");
  return <div className="space-y-2 rounded-md border border-dashed border-border p-3 text-sm">
    <p className="font-medium">Monitoring test (temporary)</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={async () => {
        try { await triggerTestServerError(); } catch { setSent("Server test error sent."); }
      }}>Send server test error</Button>
      <Button type="button" variant="outline" onClick={() => setCrash(true)}>Send browser test error</Button>
    </div>
    {sent && <p role="status">{sent}</p>}
  </div>;
}
