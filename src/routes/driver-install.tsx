import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// TODO: Replace with real Google Drive file id once the APK is uploaded.
const APK_URL =
  "https://drive.google.com/uc?export=download&id=YOUR_APK_FILE_ID";

export const Route = createFileRoute("/driver-install")({
  head: () => ({
    meta: [
      { title: "Install KP Driver — Kings Pharmacy" },
      {
        name: "description",
        content:
          "Install the Kings Pharmacy Driver app on your phone before signing in.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DriverInstallGate,
});

type Platform = "android" | "ios" | "other";

function DriverInstallGate() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("other");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean })
        .standalone === true;

    if (isStandalone) {
      localStorage.setItem("kp-driver-installed", "true");
      navigate({ to: "/driver", replace: true });
      return;
    }

    if (localStorage.getItem("kp-driver-installed") === "true") {
      navigate({ to: "/driver", replace: true });
      return;
    }

    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      setPlatform("android");
      setReady(true);
    } else if (
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    ) {
      setPlatform("ios");
      setReady(true);
    } else {
      // Desktop / other — no install possible, let them through
      navigate({ to: "/driver", replace: true });
    }
  }, [navigate]);

  const markInstalled = () => {
    localStorage.setItem("kp-driver-installed", "true");
    navigate({ to: "/driver", replace: true });
  };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1B3A6B",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1B3A6B",
        color: "white",
        padding: "28px 20px 40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            margin: "0 auto 16px",
          }}
        >
          🛵
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: -0.5,
          }}
        >
          KP Driver
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            opacity: 0.75,
            marginTop: 4,
          }}
        >
          Kings Pharmacy Delivery App
        </div>

        <div
          style={{
            marginTop: 22,
            padding: "10px 14px",
            borderRadius: 999,
            background: "#F59E0B",
            color: "#1B3A6B",
            textAlign: "center",
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: 0.6,
          }}
        >
          ⚠️ APP INSTALLATION REQUIRED
        </div>

        {platform === "android" && (
          <AndroidBody
            onInstalled={markInstalled}
          />
        )}
        {platform === "ios" && <IosBody onInstalled={markInstalled} />}

        <div
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: 11,
            opacity: 0.5,
          }}
        >
          kingspharmacy.co.zw
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 20,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 18,
      }}
    >
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: { n: string; text: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {steps.map((s) => (
        <div key={s.n} style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              flexShrink: 0,
              width: 30,
              height: 30,
              borderRadius: 999,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {s.n}
          </div>
          <div style={{ paddingTop: 4, fontSize: 13, opacity: 0.92 }}>
            {s.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function AndroidBody({ onInstalled }: { onInstalled: () => void }) {
  return (
    <>
      <Card>
        <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>
          Step 1 — Download the app
        </div>
        <div
          style={{ fontSize: 13, opacity: 0.85, marginBottom: 14, lineHeight: 1.5 }}
        >
          Download and install the KP Driver app on your Android phone. Takes
          less than 30 seconds.
        </div>
        <a
          href={APK_URL}
          download="KPDriver.apk"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            height: 58,
            borderRadius: 29,
            background: "white",
            color: "#1B3A6B",
            fontWeight: 900,
            fontSize: 16,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          ⬇️ Download KP Driver (.apk)
        </a>
        <div
          style={{
            marginTop: 10,
            textAlign: "center",
            fontSize: 11,
            opacity: 0.7,
          }}
        >
          Android APK · ~5MB · Free
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 12 }}>
          Step 2 — Install the downloaded file
        </div>
        <StepList
          steps={[
            { n: "1", text: "Open your Downloads folder or notification" },
            { n: "2", text: "Tap KPDriver.apk to open it" },
            {
              n: "3",
              text: 'If prompted, tap "Install anyway" or enable "Install unknown apps" in Settings',
            },
            { n: "4", text: "Tap Install — done!" },
          ]}
        />
      </Card>

      <Card>
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>
          Alternative: Install via Chrome
        </div>
        {[
          "Open this page in Chrome browser",
          'Tap the ⋮ menu → "Add to Home screen"',
          'Tap "Install" in the popup',
        ].map((s, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              opacity: 0.85,
              padding: "4px 0",
            }}
          >
            {i + 1}. {s}
          </div>
        ))}
      </Card>

      <button
        type="button"
        onClick={onInstalled}
        style={{
          marginTop: 22,
          width: "100%",
          height: 54,
          borderRadius: 27,
          background: "transparent",
          border: "2px solid rgba(255,255,255,0.6)",
          color: "white",
          fontWeight: 900,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        ✅ I've installed the app — Continue
      </button>
    </>
  );
}

function IosBody({ onInstalled }: { onInstalled: () => void }) {
  const steps = [
    {
      icon: "↑",
      title: "Tap Share",
      desc: "Tap the Share button (□↑) at the bottom of Safari",
    },
    {
      icon: "➕",
      title: "Add to Home Screen",
      desc: 'Scroll down in the menu and tap "Add to Home Screen"',
    },
    {
      icon: "✓",
      title: "Tap Add",
      desc: 'Tap "Add" in the top right — KP Driver appears on your home screen',
    },
    {
      icon: "🚀",
      title: "Open KP Driver",
      desc: "Open the app from your home screen and sign in",
    },
  ];

  return (
    <>
      <Card>
        <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>
          Install on iPhone
        </div>
        <div
          style={{
            fontSize: 13,
            opacity: 0.85,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Open this page in Safari (not Chrome) then follow these steps:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((s) => (
            <div key={s.title} style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {s.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{s.title}</div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.85,
                    marginTop: 2,
                    lineHeight: 1.45,
                  }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div
          style={{
            fontWeight: 900,
            fontSize: 13,
            marginBottom: 6,
            color: "#FDE68A",
          }}
        >
          ⚠️ Must use Safari on iPhone
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
          The "Add to Home Screen" option only appears in Safari. If you are
          using Chrome, copy the URL and open it in Safari instead.
        </div>
      </Card>

      <button
        type="button"
        onClick={onInstalled}
        style={{
          marginTop: 22,
          width: "100%",
          height: 54,
          borderRadius: 27,
          background: "transparent",
          border: "2px solid rgba(255,255,255,0.6)",
          color: "white",
          fontWeight: 900,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        ✅ I've installed it — Open App
      </button>
    </>
  );
}