import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStaffAuth } from "@/store/staffAuth";

export const Route = createFileRoute("/staff/")({
  component: StaffIndex,
});

function StaffIndex() {
  const staff = useStaffAuth((s) => s.staff);
  const navigate = useNavigate();
  useEffect(() => {
    if (!staff) {
      navigate({ to: "/staff/login", replace: true });
      return;
    }
    const adminRoles = ["system_admin", "super_admin"];
    navigate({
      to: adminRoles.includes(staff.role) ? "/staff/select-portal" : "/staff/dashboard",
      replace: true,
    });
  }, [staff, navigate]);
  return null;
}