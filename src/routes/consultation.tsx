import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, MessageCircle, Phone, User } from "lucide-react";
import { BRANCHES, getBranch } from "@/data/branches";
import { useConsultations, type Consultation } from "@/store/consultations";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "Book a Consultation — Kings Pharmacy" },
      {
        name: "description",
        content:
          "Book a one-on-one consultation with a Kings Pharmacy pharmacist at the branch nearest you.",
      },
    ],
  }),
  component: ConsultationPage,
});

function ConsultationPage() {
  const add = useConsultations((s) => s.add);
  const [submitted, setSubmitted] = useState<Consultation | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    branchId: BRANCHES[0].id,
    preferredDate: "",
    preferredTime: "",
    reason: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.preferredDate || !form.preferredTime) {
      toast.error("Please fill in name, phone, date and time.");
      return;
    }
    const branch = getBranch(form.branchId);
    const booking = add({
      fullName: form.fullName,
      phone: form.phone,
      branchId: branch.id,
      branchName: branch.name,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      reason: form.reason || "General consultation",
    });
    setSubmitted(booking);
    toast.success("Booking confirmed — reference " + booking.id);
  };

  if (submitted) {
    const branch = getBranch(submitted.branchId);
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-[#BBF7D0] bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0EA5E9] text-white">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-[#111827]">
            Consultation booked
          </h1>
          <p className="mt-1 text-sm text-[#374151]">
            Thank you, {submitted.fullName.split(" ")[0]}. A pharmacist will call
            you to confirm shortly.
          </p>
          <div className="mt-5 rounded-xl bg-[#F0F9F4] p-4 text-left text-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9]">
              Reference
            </div>
            <div className="mt-0.5 font-mono text-lg font-extrabold text-[#111827]">
              {submitted.id}
            </div>
            <div className="mt-3 grid gap-2 text-[13px] text-[#374151]">
              <div>
                <strong>{branch.name}</strong>
                <div className="text-xs text-[#6B7280]">{branch.address}</div>
              </div>
              <div>
                <strong>When:</strong> {submitted.preferredDate} at {submitted.preferredTime}
              </div>
              <div>
                <strong>Phone:</strong> {submitted.phone}
              </div>
              <div>
                <strong>Reason:</strong> {submitted.reason}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <a
              href={
                "https://wa.me/" +
                branch.whatsapp +
                "?text=" +
                encodeURIComponent(
                  "Hi Kings Pharmacy, I've just booked a consultation (ref " +
                    submitted.id +
                    "). "
                )
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#25D366] px-5 py-3 text-sm font-bold text-white"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp {branch.shortName}
            </a>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border-2 border-primary px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">
          Pharmacy Services
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#111827] md:text-3xl">
          Book a Consultation
        </h1>
        <p className="mt-2 text-sm text-[#374151]">
          Speak with a Kings Pharmacy pharmacist — free of charge, in person at your
          chosen branch. We'll confirm your slot by phone or WhatsApp.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            icon={<User className="h-4 w-4" />}
            label="Full name"
            value={form.fullName}
            onChange={(v) => setForm({ ...form, fullName: v })}
            placeholder="e.g. Tatenda Moyo"
            required
          />
          <Field
            icon={<Phone className="h-4 w-4" />}
            label="Phone number"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            placeholder="+263 77 123 4567"
            required
          />
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#374151]">
            Preferred branch
          </span>
          <select
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            className="min-h-11 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            icon={<CalendarDays className="h-4 w-4" />}
            label="Preferred date"
            type="date"
            value={form.preferredDate}
            onChange={(v) => setForm({ ...form, preferredDate: v })}
            required
          />
          <Field
            label="Preferred time"
            type="time"
            value={form.preferredTime}
            onChange={(v) => setForm({ ...form, preferredTime: v })}
            required
          />
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#374151]">
            Reason for consultation
          </span>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="e.g. Blood pressure check, repeat script advice, medication review…"
            rows={4}
            className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <button
          type="submit"
          className="min-h-11 w-full rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
        >
          Confirm Booking
        </button>
        <p className="text-center text-[11px] text-[#6B7280]">
          You'll receive a reference number and a call from our pharmacy team.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#374151]">
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="min-h-11 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}