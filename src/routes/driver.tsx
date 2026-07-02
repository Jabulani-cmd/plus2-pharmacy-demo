import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver")({
  component: DriverLayout,
});

function DriverLayout() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [showSplash, setShowSplash] = useState(false);

  // Standalone-install splash screen (installed PWA only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (!standalone) return;
    if (sessionStorage.getItem("kp-driver-splash-shown") === "1") return;
    sessionStorage.setItem("kp-driver-splash-shown", "1");
    setShowSplash(true);
    const t = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Online / offline detection.
  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      toast.error("No internet connection", {
        description: "Your delivery updates will sync when you reconnect.",
        id: "driver-offline-toast",
        duration: Infinity,
      });
    };
    const goOnline = () => {
      setIsOffline(false);
      toast.dismiss("driver-offline-toast");
      toast.success("Back online");
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <>
      {showSplash && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-[#1B3A6B]">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-6xl">
            🛵
          </div>
          <div className="text-center text-white">
            <div className="text-2xl font-black">KP Driver</div>
            <div className="mt-1 text-sm opacity-70">Kings Pharmacy</div>
          </div>
        </div>
      )}
      {isOffline && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-bold text-white">
          <span>📶</span> No internet — working offline
        </div>
      )}
      <Outlet />
    </>
  );
}