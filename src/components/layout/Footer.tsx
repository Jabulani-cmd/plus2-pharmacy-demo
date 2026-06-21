import { useState } from "react";
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Lock, ChevronDown } from "lucide-react";
import kingsLogo from "@/assets/kings-logo.png";

const COLS = [
  {
    title: "Shop",
    links: ["Pharmacy & Medicines", "Beauty & Skincare", "Baby & Maternity", "Vitamins & Supplements", "Sports Nutrition", "Personal Care", "Household"],
  },
  {
    title: "Patient Services",
    links: ["Upload a Prescription", "Track My Order", "Find a Pharmacy", "Chronic Medication", "Pharmacy Services", "Health Screenings", "Book a Consultation"],
  },
  {
    title: "Help & Info",
    links: ["Contact Us", "FAQs", "Delivery Information", "Returns Policy", "Privacy Policy", "Terms & Conditions", "Careers at Kings"],
  },
];

export function Footer() {
  return (
    <footer className="mt-16">
      <div className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white p-1">
                <img src={kingsLogo} alt="Kings Pharmacy" className="h-full w-full object-contain" />
              </div>
              <div className="text-[17px] font-bold tracking-tight">Kings Pharmacy</div>
            </div>
            <p className="mt-3 text-sm text-white/85">Your Health, Our Priority</p>
            <p className="mt-3 text-[13px] leading-6 text-white/75">
              Zimbabwe's trusted online pharmacy. Delivering quality healthcare products and prescription medication to your door.
            </p>
            <div className="mt-5 flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube, Linkedin].map((I, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-white/85 transition hover:scale-110 hover:text-white"
                  aria-label="Social link"
                >
                  <I className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
      </div>

      <div className="bg-primary-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-[12px] md:flex-row">
          <div className="text-center text-white/70 md:text-left">
            <p>© 2026 Kings Pharmacy (Private) Limited. All Rights Reserved.</p>
            <p>
              Licensed by the Pharmacists Council of Zimbabwe (PCZ) · MCAZ Accredited ·
              ZIMRA VAT Reg No. 10045821 · BP No. 2001234567
            </p>
            <p className="mt-1">
              Designed &amp; developed by{" "}
              <a
                href="#"
                className="font-semibold text-white hover:underline"
              >
                Mavingtech Business Solutions
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-white/85">
            <span className="rounded bg-white px-2 py-1 text-[10px] font-bold text-[#1A1F71]">VISA</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-bold text-[#EB001B]">MC</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-bold text-[#0EA5E9]">EcoCash</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-bold text-[#374151]">ZIG</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/85">
              <Lock className="h-3 w-3" /> SSL Secured
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/15 md:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3 md:cursor-default md:py-0"
      >
        <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white">{title}</h4>
        <ChevronDown className={`h-4 w-4 text-white transition md:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <ul className={`space-y-2.5 pb-4 md:mt-4 md:block md:pb-0 ${open ? "block" : "hidden"}`}>
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-[14px] text-white/80 transition hover:text-white hover:underline">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}