import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ShoppingBag, FileText, ExternalLink } from "lucide-react";
import { DemoController } from "@/components/layout/DemoController";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo Mode — Kings Pharmacy" }] }),
  component: DemoPage,
});

function DemoPage() {
  const [open, setOpen] = useState<"otc" | "rx" | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">Demo Mode</h1>
          <p className="text-sm text-muted-foreground">
            Presenter-controlled walkthrough of the Kings Pharmacy workflow.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setOpen("otc")}
          className="rounded-2xl border-2 border-primary/20 bg-card p-6 text-left shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold">OTC Shopping Demo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            10-stage walkthrough from browsing → cart → checkout → packing → dispatch → delivery.
          </p>
        </button>

        <button
          onClick={() => setOpen("rx")}
          className="rounded-2xl border-2 border-primary/20 bg-card p-6 text-left shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold">Prescription Demo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload → pharmacist review → quote → payment → dispense → delivery → rating.
          </p>
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-5 text-sm">
        <h3 className="font-extrabold">How it works</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Place a real order or upload a prescription first so the demo has live data to drive.</li>
          <li>Open the demo controller, pick a flow and press <em>Start Demo</em>.</li>
          <li>Use <em>Next Stage</em> to advance manually — every transition is presenter-controlled.</li>
          <li>
            Switch between customer and staff views using these tabs:{" "}
            <Link to="/account" className="font-bold text-primary hover:underline">
              Customer Dashboard <ExternalLink className="inline h-3 w-3" />
            </Link>{" "}
            ·{" "}
            <Link to="/staff/dashboard" className="font-bold text-primary hover:underline">
              Staff Dashboard <ExternalLink className="inline h-3 w-3" />
            </Link>
          </li>
        </ul>
      </div>

      {open && <DemoController flow={open} onClose={() => setOpen(null)} />}
    </div>
  );
}