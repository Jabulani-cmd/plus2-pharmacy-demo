import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { useOrderExtras } from "@/store/orderExtras";

export function RatingPrompt({ orderId, onDone }: { orderId: string; onDone?: () => void }) {
  const rate = useOrderExtras((s) => s.rate);
  const existing = useOrderExtras((s) => s.ratings.find((r) => r.orderId === orderId));
  const addPoints = useOrderExtras((s) => s.addPoints);

  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [submitted, setSubmitted] = useState(Boolean(existing));

  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <div className="flex-1">
          <div className="font-extrabold text-emerald-800">Thank you for your feedback!</div>
          <div className="text-xs text-emerald-700">
            You rated this delivery {stars} of 5 stars.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card p-5 shadow-sm">
      <h3 className="text-base font-extrabold text-foreground">How was your delivery?</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap a star to rate your driver and earn 10 loyalty points.
      </p>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || stars) >= n;
          return (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(n)}
              aria-label={`Rate ${n} stars`}
              className="p-1"
            >
              <Star
                className={"h-8 w-8 transition " + (filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
              />
            </button>
          );
        })}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Optional comment (e.g. driver was friendly, on time)"
        className="mt-3 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        disabled={stars === 0}
        onClick={() => {
          rate(orderId, stars, comment.trim() || undefined);
          addPoints(10);
          setSubmitted(true);
          onDone?.();
        }}
        className="mt-3 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground transition hover:bg-primary-dark disabled:opacity-50"
      >
        Submit rating
      </button>
    </div>
  );
}