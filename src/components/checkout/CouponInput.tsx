import { useState } from "react";
import { Tag, CheckCircle2, X } from "lucide-react";
import { applyCoupon } from "@/store/orderExtras";

export type AppliedCoupon = { code: string; discount: number; label: string };

export function CouponInput({
  applied,
  onApply,
  onClear,
}: {
  applied: AppliedCoupon | null;
  onApply: (c: AppliedCoupon) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(code);
    if (!res) {
      setError("Invalid coupon code");
      return;
    }
    setError(null);
    onApply({ code: code.trim().toUpperCase(), discount: res.discount, label: res.label });
    setCode("");
  };

  if (applied) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <div className="flex-1">
          <div className="font-extrabold text-emerald-800">{applied.label}</div>
          <div className="text-xs text-emerald-700">Code: {applied.code}</div>
        </div>
        <button
          onClick={onClear}
          className="rounded-full p-1 text-emerald-700 hover:bg-emerald-100"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-bold text-primary"
      >
        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4" /> Have a coupon code?
        </span>
        <span className="text-xs">{open ? "Hide" : "Add"}</span>
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="e.g. KINGS10"
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm uppercase outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark"
          >
            Apply
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}