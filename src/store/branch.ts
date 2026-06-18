import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRANCHES } from "@/data/branches";

type BranchState = {
  selectedBranchId: string;
  setBranch: (id: string) => void;
};

export const useBranch = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranchId: BRANCHES[0].id,
      setBranch: (id) => set({ selectedBranchId: id }),
    }),
    { name: "kings-branch" },
  ),
);