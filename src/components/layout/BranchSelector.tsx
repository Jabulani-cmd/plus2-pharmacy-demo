import { MapPin, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRANCHES, getBranch } from "@/data/branches";
import { useBranch } from "@/store/branch";

export function BranchSelector({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const selectedId = useBranch((s) => s.selectedBranchId);
  const setBranch = useBranch((s) => s.setBranch);
  const current = getBranch(selectedId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          variant === "compact"
            ? "flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-[#374151] hover:text-primary"
            : "flex w-full items-center justify-between gap-2 rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:border-primary"
        }
        aria-label="Choose branch"
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Branch:</span>
          <span className="font-semibold">{current.shortName}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Select your branch — Bulawayo
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BRANCHES.map((b) => {
          const active = b.id === selectedId;
          return (
            <DropdownMenuItem
              key={b.id}
              onSelect={() => setBranch(b.id)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">{b.shortName}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </div>
              <span className="text-[11px] text-muted-foreground">{b.address}</span>
              <span className="text-[11px] text-muted-foreground">{b.phone}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}