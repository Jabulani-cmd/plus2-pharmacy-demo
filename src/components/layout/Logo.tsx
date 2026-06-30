import { Link } from "@tanstack/react-router";
import kingsLogo from "@/assets/kings-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex min-w-0 items-center gap-2 ${className}`} aria-label="Kings Pharmacy home">
      <img src={kingsLogo} alt="Kings Pharmacy" className="h-10 w-10 shrink-0 object-contain md:h-16 md:w-16" />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-bold tracking-tight text-[#111827] md:text-[17px]">Kings <span className="font-medium text-[#374151]">Pharmacy</span></div>
        <div className="hidden text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280] sm:block">At Your Service</div>
      </div>
    </Link>
  );
}