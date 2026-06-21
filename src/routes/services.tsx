import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pill, Syringe, HeartPulse, Activity, Baby, PawPrint, ClipboardList, Building2, MapPin } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Pharmacy Services — Kings Pharmacy" }] }),
  component: ServicesPage,
});

const SERVICES = [
  { icon: Pill, title: "Prescription Dispensing", desc: "Fast, accurate dispensing by qualified pharmacists." },
  { icon: Syringe, title: "Flu & Travel Vaccinations", desc: "Walk-in vaccinations from US$10. No appointment needed." },
  { icon: HeartPulse, title: "Chronic Medication", desc: "Auto-repeat scripts delivered monthly to your door." },
  { icon: Activity, title: "Health Screenings", desc: "Blood pressure, glucose, cholesterol — results in minutes." },
  { icon: Baby, title: "Baby Clinic", desc: "Weigh-ins, immunisations and feeding advice." },
  { icon: PawPrint, title: "Veterinary Dispensing", desc: "Pet medication, scripted and over-the-counter." },
  { icon: ClipboardList, title: "Script Repeat", desc: "SMS or WhatsApp your script — we'll have it ready." },
  { icon: Building2, title: "Medical Aid Claims", desc: "We claim directly from all major medical aids." },
];

const CITIES = ["Bulawayo", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Kwekwe"];

function ServicesPage() {
  const [city, setCity] = useState("Bulawayo");
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="overflow-hidden rounded-md bg-primary p-8 text-primary-foreground md:p-12">
        <h1 className="text-3xl font-extrabold md:text-4xl">Our Pharmacy Services</h1>
        <p className="mt-2 max-w-xl text-sm opacity-95 md:text-base">From dispensing to vaccinations, our qualified pharmacists are here to help you and your family stay healthy.</p>
        <Link
          to="/consultation"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-bold text-foreground shadow hover:bg-surface"
        >
          Book a Consultation
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold md:text-2xl">What we offer</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="group rounded-md border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-3 font-extrabold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold md:text-2xl">Find a Kings Pharmacy near you</h2>
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <div className="rounded-md border border-border bg-card p-5">
            <label className="text-sm font-bold">Choose city</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="mt-4 space-y-3 text-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-md bg-surface p-3">
                  <div className="font-bold">Kings {city} {["CBD", "Avondale", "Borrowdale"][i - 1] ?? "Mall"}</div>
                  <div className="text-xs text-muted-foreground">Open today · 08:00–20:00</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-md border border-border bg-surface text-muted-foreground md:h-auto">
            <MapPin className="h-10 w-10 text-primary/60" />
            <span className="text-sm font-semibold">Store locator map</span>
          </div>
        </div>
      </section>
    </div>
  );
}