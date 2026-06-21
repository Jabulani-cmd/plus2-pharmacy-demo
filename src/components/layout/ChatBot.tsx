import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles, MessageCircle, MapPin } from "lucide-react";
import { BRANCHES, getBranch } from "@/data/branches";
import { useBranch } from "@/store/branch";
import { Link } from "@tanstack/react-router";

type Msg = {
  id: string;
  from: "bot" | "user";
  text: string;
  link?: { to: string; label: string };
  branchPicker?: boolean;
  whatsapp?: { number: string; name: string };
};

const INTRO: Msg = {
  id: "intro",
  from: "bot",
  text:
    "Hi! I'm the Kings Pharmacy assistant. Ask me about branches, delivery, prescriptions, payments or booking a consultation.",
};

const SUGGESTIONS = [
  "Where are your branches?",
  "Choose a branch",
  "How does delivery work?",
  "Upload a prescription",
  "Book a consultation",
  "Payment methods",
];

function answer(q: string): Msg {
  const text = q.toLowerCase();
  const id = crypto.randomUUID();
  if (/choose.*branch|switch.*branch|change.*branch|select.*branch|set.*branch|my branch/.test(text)) {
    return {
      id,
      from: "bot",
      text: "Sure — which branch would you like to use? I'll remember it for this visit.",
      branchPicker: true,
    };
  }
  if (/branch|location|where|address|shop|store/.test(text)) {
    return {
      id,
      from: "bot",
      text:
        "We have 4 branches in Bulawayo. Tap one to make it your branch or to chat on WhatsApp.",
      branchPicker: true,
    };
  }
  if (/deliver|courier|ship/.test(text)) {
    return {
      id,
      from: "bot",
      text: "Free delivery within 10km on orders over $30. You can also pick up at any branch at checkout.",
    };
  }
  if (/prescription|rx|script|upload/.test(text)) {
    return {
      id,
      from: "bot",
      text: "Upload your prescription and our pharmacist will send you a quotation. Pay in-app to dispatch.",
      link: { to: "/prescriptions", label: "Upload prescription" },
    };
  }
  if (/consult|doctor|appointment|book/.test(text)) {
    return {
      id,
      from: "bot",
      text: "You can book a free consultation at any branch.",
      link: { to: "/consultation", label: "Book a consultation" },
    };
  }
  if (/pay|ecocash|visa|card|zipit|cash/.test(text)) {
    return {
      id,
      from: "bot",
      text: "We accept EcoCash, ZIPIT, Visa/Mastercard, and cash on pickup or delivery.",
    };
  }
  if (/hour|open|time/.test(text)) {
    return {
      id,
      from: "bot",
      text: BRANCHES.map((b) => `• ${b.shortName}: ${b.hours}`).join("\n"),
    };
  }
  if (/track|order|status/.test(text)) {
    return {
      id,
      from: "bot",
      text: "You can track any order from your account.",
      link: { to: "/account", label: "Go to my account" },
    };
  }
  if (/hi|hello|hey|howdy/.test(text)) {
    return { id, from: "bot", text: "Hello! How can I help you today?" };
  }
  return {
    id,
    from: "bot",
    text: "I'm not sure about that yet — for anything specific, tap the WhatsApp button to chat with a branch directly.",
  };
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedBranchId = useBranch((s) => s.selectedBranchId);
  const setBranch = useBranch((s) => s.setBranch);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const userMsg: Msg = { id: crypto.randomUUID(), from: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => setMessages((m) => [...m, answer(q)]), 350);
  };

  const pickBranch = (branchId: string) => {
    const b = getBranch(branchId);
    setBranch(branchId);
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), from: "user", text: `Use ${b.shortName}` },
      {
        id: crypto.randomUUID(),
        from: "bot",
        text: `Great — ${b.shortName} is now your branch.\n${b.address}\nHours: ${b.hours}\n\nYou can also chat with this branch directly on WhatsApp.`,
        whatsapp: { number: b.whatsapp, name: b.shortName },
      },
    ]);
  };

  const openWhatsApp = (number: string, name: string) => {
    const text = "Hi Kings Pharmacy, I'd like to ask about (" + name + ")";
    const encoded = encodeURIComponent(text);
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?phone=${number}&text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 md:bg-transparent"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="fixed z-50 flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
            style={{
              right: "max(16px, env(safe-area-inset-right))",
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 156px)",
              maxHeight: "min(70vh, 560px)",
            }}
          >
            <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-extrabold leading-tight">Kings Assistant</div>
                  <div className="text-[11px] opacity-80">Usually replies instantly</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-white/15"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollerRef} className="flex-1 space-y-2 overflow-y-auto bg-[#F8FAFC] px-3 py-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    "flex " + (m.from === "user" ? "justify-end" : "justify-start")
                  }
                >
                  <div
                    className={
                      "max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm " +
                      (m.from === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-white text-[#111827] shadow-sm")
                    }
                  >
                    {m.text}
                    {m.link && (
                      <div className="mt-2">
                        <Link
                          to={m.link.to}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                        >
                          {m.link.label}
                        </Link>
                      </div>
                    )}
                    {m.branchPicker && (
                      <ul className="mt-2 space-y-1">
                        {BRANCHES.map((b) => {
                          const active = b.id === selectedBranchId;
                          return (
                            <li key={b.id}>
                              <button
                                onClick={() => pickBranch(b.id)}
                                className={
                                  "flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition " +
                                  (active
                                    ? "border-primary bg-primary/5"
                                    : "border-[#E5E7EB] bg-white hover:border-primary")
                                }
                              >
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-xs font-bold text-[#111827]">
                                    {b.shortName}
                                    {active && (
                                      <span className="ml-1 text-[10px] font-semibold text-primary">
                                        · your branch
                                      </span>
                                    )}
                                  </span>
                                  <span className="block truncate text-[11px] text-[#6B7280]">
                                    {b.address}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {m.whatsapp && (
                      <div className="mt-2">
                        <button
                          onClick={() => openWhatsApp(m.whatsapp!.number, m.whatsapp!.name)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1DA851]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Chat with {m.whatsapp.name} on WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F3F4F6] bg-white px-3 py-2">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] text-[#374151] hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-[#9CA3AF]">
                <Sparkles className="h-3 w-3" /> Automated assistant — for urgent help, use WhatsApp.
              </p>
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl ring-4 ring-white/40 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30"
        style={{
          right: "max(16px, env(safe-area-inset-right))",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 150px)",
        }}
        aria-label="Open chat assistant"
        aria-expanded={open}
      >
        <Bot className="h-7 w-7" strokeWidth={2.2} />
      </button>
    </>
  );
}