import { Link } from "@tanstack/react-router";
import kingsLogo from "@/assets/kings-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Kings Pharmacy home">
      <img src={kingsLogo} alt="Kings Pharmacy" className="h-16 w-16 object-contain" />
      <div className="leading-tight">
        <div className="text-[17px] font-bold tracking-tight text-[#111827]">Kings <span className="font-medium text-[#374151]">Pharmacy</span></div>
        <div className="hidden text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280] sm:block">At Your Service</div>
      </div>
    </Link>
  );
}