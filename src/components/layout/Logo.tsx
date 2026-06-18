import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Kings Pharmacy home">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[17px] font-bold tracking-tight text-[#111827]">Kings <span className="font-medium text-[#374151]">Pharmacy</span></div>
        <div className="hidden text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280] sm:block">Your Health · Our Priority</div>
      </div>
    </Link>
  );
}