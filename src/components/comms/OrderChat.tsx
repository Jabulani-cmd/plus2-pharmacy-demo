import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, X } from "lucide-react";
import { useOrderExtras } from "@/store/orderExtras";

type Props = {
  orderId: string;
  /** Which side of the conversation is viewing this panel. */
  perspective: "customer" | "driver";
  /** Other party name, for the header */
  partnerName: string;
  /** Render as a small floating panel (true) or inline card (false). */
  floating?: boolean;
  onClose?: () => void;
};

export function OrderChat({ orderId, perspective, partnerName, floating = false, onClose }: Props) {
  const messages = useOrderExtras((s) => s.messages.filter((m) => m.orderId === orderId));
  const send = useOrderExtras((s) => s.sendMessage);
  const seed = useOrderExtras((s) => s.seedDemoChat);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    seed(orderId);
  }, [orderId, seed]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    send(orderId, perspective, text);
    setText("");
  };

  return (
    <div
      className={
        floating
          ? "fixed bottom-4 right-4 z-40 flex h-[460px] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          : "flex h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      }
    >
      <header className="flex items-center justify-between gap-2 border-b border-border bg-primary px-3 py-2 text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <div className="leading-tight">
            <div className="text-xs font-extrabold">Chat with {partnerName}</div>
            <div className="text-[10px] opacity-80">Order {orderId}</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close chat">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto bg-[#F5F7FB] px-3 py-3">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Say hello — your driver can read your messages in real time.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.from === perspective;
          return (
            <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div
                className={
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm " +
                  (mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-white text-foreground border border-border")
                }
              >
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                <div className={"mt-1 text-[10px] " + (mine ? "text-white/70 text-right" : "text-muted-foreground")}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-card p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="h-10 flex-1 rounded-full border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-dark disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}