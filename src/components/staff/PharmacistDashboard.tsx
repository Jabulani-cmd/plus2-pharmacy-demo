import { useEffect, useMemo } from "react";
import { useSharedPrescriptions, refreshPrescriptions } from "@/store/sharedPrescriptions";
import { PageHeader, KPI, Card } from "./shared";
import { FileText, Clock, Pill, Info } from "lucide-react";

// ============================================================
// PHARMACIST DASHBOARD — READ ONLY
// The dispatcher now owns the prescription lifecycle. The pharmacist
// simply dispenses medication when the dispatcher hands them a
// printed script. This screen is a live queue of scripts that have
// been printed and are awaiting dispensing.
// ============================================================
export function PharmacistDashboard(_props: { view?: string } = {}) {
  const prescriptions = useSharedPrescriptions((s) => s.prescriptions);

  useEffect(() => {
    void refreshPrescriptions();
    const interval = setInterval(() => void refreshPrescriptions(), 15_000);
    return () => clearInterval(interval);
  }, []);

  const printingRx = useMemo(
    () => prescriptions.filter((p) => p.status === "Printing"),
    [prescriptions],
  );
  const readyRx = useMemo(
    () => prescriptions.filter((p) => p.status === "Ready to Quote"),
    [prescriptions],
  );
  const dispensedToday = useMemo(
    () =>
      prescriptions.filter(
        (p) =>
          p.status === "Paid" ||
          p.status === "Dispensing" ||
          p.status === "Out for Delivery" ||
          p.status === "Delivered",
      ).length,
    [prescriptions],
  );

  return (
    <div>
      <PageHeader
        title="Pharmacist Station"
        subtitle="Prescriptions for dispensing are printed and handed to you by the dispatcher."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KPI
          label="Awaiting dispensing"
          value={String(printingRx.length)}
          hint="scripts on your bench"
          accent="#F59E0B"
          icon={<Clock className="h-5 w-5" />}
        />
        <KPI
          label="Ready to quote"
          value={String(readyRx.length)}
          hint="handed back to dispatcher"
          accent="#8B5CF6"
          icon={<FileText className="h-5 w-5" />}
        />
        <KPI
          label="Dispensed today"
          value={String(dispensedToday)}
          accent="#0EA5E9"
          icon={<Pill className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#1E5BC6]/25 bg-[#EAF3FF] p-4 text-sm text-[#1B3A6B]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Prescription approval and pricing are handled by the dispatcher.
          When the dispatcher hands you a printed script, prepare the
          medication and let them know it is ready — they will send the
          quotation to the customer.
        </p>
      </div>

      <div className="mt-6">
        <Card title={"Prescriptions to dispense (" + printingRx.length + ")"}>
          {printingRx.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No prescriptions to dispense right now. The dispatcher will
              print and hand you scripts when they arrive.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {printingRx.map((rx) => (
                <li key={rx.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-foreground">{rx.patientName}</div>
                    <div className="text-xs text-muted-foreground">
                      #{rx.id} · {rx.uploadedAt}
                      {rx.doctorName ? " · " + rx.doctorName : ""}
                    </div>
                    {rx.notes && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold">Notes: </span>
                        {rx.notes}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    ⏳ Awaiting your dispensing
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {readyRx.length > 0 && (
        <div className="mt-6">
          <Card title={"Ready to quote (" + readyRx.length + ")"}>
            <ul className="divide-y divide-border">
              {readyRx.map((rx) => (
                <li key={rx.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-foreground">{rx.patientName}</div>
                    <div className="text-xs text-muted-foreground">
                      #{rx.id} · Ready — dispatcher will quote
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
