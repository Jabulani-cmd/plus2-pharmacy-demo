import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useShop, formatUSD } from "@/store/shop";
import { getProduct } from "@/data/products";
import { Check, Truck, MapPin, CreditCard } from "lucide-react";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { buildReceipt, type Receipt } from "@/lib/receipts";
import PaymentModal from "@/components/checkout/PaymentModal";
import { useSharedOrders } from "@/store/sharedOrders";
import { useAuth } from "@/store/auth";
import { useBranch } from "@/store/branch";
import { CouponInput, type AppliedCoupon } from "@/components/checkout/CouponInput";
import { useOrderExtras } from "@/store/orderExtras";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Kings Pharmacy" }] }),
  component: Checkout,
});

const STEPS = ["Delivery", "Payment", "Review", "Done"] as const;

function Checkout() {
  const cart = useShop((s) => s.cart);
  const clearCart = useShop((s) => s.clearCart);
  const navigate = useNavigate();
  const addSharedOrder = useSharedOrders((s) => s.addOrder);
  const user = useAuth((s) => s.user);
  const branchId = useBranch((s) => s.selectedBranchId);

  const items = cart
    .map((c) => ({ ...c, product: getProduct(c.id)! }))
    .filter((i) => i.product);

  const subtotal = items.reduce(
    (s, i) => s + i.product.price * i.qty,
    0
  );
  const deliveryFee = subtotal >= 50 ? 0 : 5;
  const vat = parseFloat((subtotal * 0.15).toFixed(2));
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const discountAmount = coupon
    ? +(subtotal * coupon.discount).toFixed(2)
    : 0;
  const total = parseFloat(
    (subtotal + deliveryFee + vat - discountAmount).toFixed(2)
  );
  const addPoints = useOrderExtras((s) => s.addPoints);

  const [step, setStep] = useState(0);
  const [delivery_, setDelivery] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    suburb: "",
    city: "Bulawayo",
    province: "Bulawayo",
    postal: "",
    method: "standard",
  });

  const orderNumber =
    "KP-" + Math.floor(100000 + Math.random() * 900000);

  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [paidRef, setPaidRef] = useState<string | null>(null);
  const [paidMethod, setPaidMethod] = useState<string | null>(null);

  if (items.length === 0 && step < 3) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">
          Your cart is empty.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-primary
            px-6 py-3 font-bold text-primary-foreground"
        >
          Shop now
        </Link>
      </div>
    );
  }

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const makeReceipt = (auth: string, method: string) => {
    const deliveryLabel = (
      {
        standard: "Standard Delivery",
        express: "Same-day Express",
        national: "Nationwide Courier",
        collect: "Click & Collect",
      } as Record<string, string>
    )[delivery_.method] ?? "Standard";

    const addr =
      delivery_.method === "collect"
        ? "Pick up: Hillside Branch, Bulawayo"
        : `${delivery_.firstName} ${delivery_.lastName}, ` +
          `${delivery_.street}, ${delivery_.suburb}, ` +
          `${delivery_.city}, Zimbabwe`;

    return buildReceipt({
      orderNumber,
      authRef: auth,
      items: items.map((i) => ({
        name: i.product.name,
        sku: i.product.id.toUpperCase(),
        qty: i.qty,
        unitPrice: i.product.price,
        lineTotal: +(i.product.price * i.qty).toFixed(2),
      })),
      customer: {
        name:
          `${delivery_.firstName || "Demo"} ` +
          `${delivery_.lastName || "Customer"}`.trim(),
        email:
          delivery_.email || "customer@kingspharmacy.co.zw",
        phone: delivery_.phone || "+263 78 200 0100",
        address: addr,
      },
      paymentMethod: labelFor(method),
      deliveryMethod: deliveryLabel,
      deliveryFee,
    });
  };

  const handlePlaceOrder = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = (
    ref: string,
    method: string
  ) => {
    setPaidRef(ref);
    setPaidMethod(method);
    const r = makeReceipt(ref, method);
    setReceipt(r);
    setShowPayment(false);

    // Persist into shared dispatch store so staff can see it.
    const customerName =
      ((delivery_.firstName || user?.firstName || "Demo") +
        " " +
        (delivery_.lastName || user?.lastName || "Customer")).trim();
    const address =
      delivery_.method === "collect"
        ? "Pick up at branch"
        : [
            delivery_.street,
            delivery_.suburb,
            delivery_.city,
          ]
            .filter(Boolean)
            .join(", ");
    addSharedOrder({
      id: orderNumber,
      customerId: user?.id,
      customerEmail: user?.email ?? delivery_.email,
      customer: customerName,
      phone: delivery_.phone || user?.phone || "",
      branchId,
      items: items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        qty: i.qty,
        price: i.product.price,
      })),
      itemCount: items.reduce((a, i) => a + i.qty, 0),
      address,
      deliveryMethod: delivery_.method,
      paymentMethod: labelFor(method),
      paymentRef: ref,
      total,
    });

    clearCart();
    setStep(3);
    // Award OTC loyalty points
    addPoints(10);
    toast.success("Payment confirmed — order placed");
  };

  const itemSummary =
    items.length === 1
      ? `${items[0].product.name} ×${items[0].qty}`
      : `${items.length} items`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">
        Checkout
      </h1>

      {/* Stepper */}
      <div className="mt-6 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center
                justify-center rounded-full text-sm font-bold
                ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
            >
              {i < step ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <div className="ml-2 hidden text-sm font-bold sm:block">
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  i < step ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-border
          bg-card p-6"
        >

          {/* ---- STEP 0: DELIVERY ---- */}
          {step === 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg
                font-extrabold"
              >
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Details
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field
                  label="First name"
                  value={delivery_.firstName}
                  onChange={(v) =>
                    setDelivery({ ...delivery_, firstName: v })
                  }
                />
                <Field
                  label="Last name"
                  value={delivery_.lastName}
                  onChange={(v) =>
                    setDelivery({ ...delivery_, lastName: v })
                  }
                />
                <Field
                  label="Phone"
                  value={delivery_.phone}
                  onChange={(v) =>
                    setDelivery({ ...delivery_, phone: v })
                  }
                  placeholder="+263 77 123 4567"
                />
                <Field
                  label="Email"
                  value={delivery_.email}
                  onChange={(v) =>
                    setDelivery({ ...delivery_, email: v })
                  }
                  type="email"
                />
                <Field
                  label="Street address"
                  value={delivery_.street}
                  onChange={(v) =>
                    setDelivery({ ...delivery_, street: v })
                  }
                  className="col-span-2"
                />
                <Field
                  label="Suburb"
                  value={delivery_.suburb}
                  onChange={(v) =>
                    setDelivery({ ...delivery_, suburb: v })
                  }
                />
                <Field
                  label="Postal code"
                  value={delivery_.postal}
                  onChange={(v) =>
                    setDelivery({ ...delivery_, postal: v })
                  }
                />
              </div>

              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold">
                  Delivery Method
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      id: "standard",
                      label: "Standard Delivery (Bulawayo metro)",
                      desc: "1–2 working days",
                      price:
                        subtotal >= 50 ? "FREE" : "$5.00",
                    },
                    {
                      id: "express",
                      label: "Same-day Express (Bulawayo)",
                      desc: "Within 4 hours",
                      price: "$8.00",
                    },
                    {
                      id: "national",
                      label: "Nationwide Courier",
                      desc:
                        "Bulawayo, Mutare, Gweru — 2–4 days",
                      price: "$12.00",
                    },
                    {
                      id: "collect",
                      label: "Click & Collect",
                      desc: "Borrowdale or Avondale branch",
                      price: "FREE",
                    },
                  ].map((d) => (
                    <label
                      key={d.id}
                      className={`flex cursor-pointer
                        items-center gap-3 rounded-lg
                        border-2 p-3 transition ${
                          delivery_.method === d.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                    >
                      <input
                        type="radio"
                        checked={delivery_.method === d.id}
                        onChange={() =>
                          setDelivery({
                            ...delivery_,
                            method: d.id,
                          })
                        }
                        className="accent-[var(--color-primary)]"
                      />
                      <Truck className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-bold">
                          {d.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {d.desc}
                        </div>
                      </div>
                      <div className="font-bold text-primary">
                        {d.price}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- STEP 1: PAYMENT INFO ---- */}
          {step === 1 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg
                font-extrabold"
              >
                <CreditCard className="h-5 w-5 text-primary" />
                Payment
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You will select your payment method and complete
                payment on the next step after reviewing your
                order.
              </p>

              <div
                className="mt-4 rounded-lg p-4 space-y-3"
                style={{
                  background: "#F0F9F4",
                  border: "1px solid #BBF7D0",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase
                    tracking-wide"
                  style={{ color: "#0EA5E9" }}
                >
                  Accepted Payment Methods
                </p>
                <div className="grid grid-cols-2 gap-2
                  sm:grid-cols-3"
                >
                  {[
                    {
                      name: "EcoCash",
                      logo: "EC",
                      color: "#E31837",
                      note: "Most popular",
                    },
                    {
                      name: "OneMoney",
                      logo: "OM",
                      color: "#F7941D",
                      note: "",
                    },
                    {
                      name: "TeleCash",
                      logo: "TC",
                      color: "#0066CC",
                      note: "",
                    },
                    {
                      name: "ZimSwitch Card",
                      logo: "ZS",
                      color: "#0EA5E9",
                      note: "",
                    },
                    {
                      name: "ZIPIT Transfer",
                      logo: "BT",
                      color: "#374151",
                      note: "",
                    },
                  ].map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center gap-2
                        rounded-lg border border-[#E5E7EB]
                        bg-white p-2.5"
                    >
                      <div
                        className="flex h-8 w-10 items-center
                          justify-center rounded-md text-xs
                          font-bold text-white flex-shrink-0"
                        style={{ background: m.color }}
                      >
                        {m.logo}
                      </div>
                      <div>
                        <p className="text-xs font-semibold
                          text-gray-900"
                        >
                          {m.name}
                        </p>
                        {m.note && (
                          <p
                            className="text-[10px]"
                            style={{ color: "#0EA5E9" }}
                          >
                            {m.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  All payments processed in USD. Secured by
                  Kings Pharmacy · ZPC Licensed · MCAZ Approved.
                </p>
              </div>
            </div>
          )}

          {/* ---- STEP 2: REVIEW ---- */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-extrabold">
                Review your order
              </h2>
              <div className="mt-4 space-y-3">
                {items.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-3
                      border-b border-border pb-3"
                  >
                    <div
                      className="flex h-12 w-12 items-center
                        justify-center overflow-hidden
                        rounded-md border border-border
                        bg-[#F9FAFB]"
                    >
                      <img
                        src={i.product.image}
                        alt={i.product.name}
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">
                        {i.product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Qty: {i.qty}
                      </div>
                    </div>
                    <div className="font-bold">
                      {formatUSD(i.product.price * i.qty)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-surface p-4
                text-sm space-y-3"
              >
                <div>
                  <div className="font-bold">Delivering to:</div>
                  <div className="text-muted-foreground">
                    {delivery_.firstName} {delivery_.lastName},{" "}
                    {delivery_.street}, {delivery_.suburb},{" "}
                    {delivery_.city}, Zimbabwe
                  </div>
                </div>
                <div>
                  <div className="font-bold">
                    Delivery method:
                  </div>
                  <div className="text-muted-foreground capitalize">
                    {(
                      {
                        standard: "Standard Delivery",
                        express: "Same-day Express",
                        national: "Nationwide Courier",
                        collect: "Click & Collect",
                      } as Record<string, string>
                    )[delivery_.method] ?? "Standard"}
                  </div>
                </div>
                <div>
                  <div className="font-bold">Payment:</div>
                  <div className="text-muted-foreground">
                    Select from EcoCash, OneMoney, TeleCash,
                    ZimSwitch or Bank Transfer on next step
                  </div>
                </div>
              </div>

              {/* Coupon code */}
              <div className="mt-4">
                <CouponInput
                  applied={coupon}
                  onApply={(c) => {
                    setCoupon(c);
                    toast.success("Coupon applied — " + c.label);
                  }}
                  onClear={() => setCoupon(null)}
                />
              </div>

              <div
                className="mt-4 rounded-lg p-3 text-sm"
                style={{
                  background: "#F0F9F4",
                  border: "1px solid #BBF7D0",
                }}
              >
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">
                    {formatUSD(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">
                    Delivery
                  </span>
                  <span className="font-semibold">
                    {deliveryFee === 0
                      ? "FREE"
                      : formatUSD(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">
                    VAT (15%)
                  </span>
                  <span className="font-semibold">
                    {formatUSD(vat)}
                  </span>
                </div>
                {coupon && (
                  <div className="flex justify-between py-1 text-emerald-700">
                    <span>Discount ({coupon.label})</span>
                    <span className="font-semibold">
                      -{formatUSD(discountAmount)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between border-t
                    border-gray-200 mt-1 pt-2"
                >
                  <span className="font-bold text-gray-900">
                    Total
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#0EA5E9" }}
                  >
                    {formatUSD(total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ---- STEP 3: CONFIRMATION ---- */}
          {step === 3 && receipt && (
            <OrderConfirmation
              receipt={receipt}
              isCollect={delivery_.method === "collect"}
            />
          )}

          {/* ---- NAV BUTTONS ---- */}
          {step < 3 && (
            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={
                  step === 0
                    ? () => navigate({ to: "/cart" })
                    : back
                }
                className="rounded-md border border-border
                  px-5 py-2.5 font-bold hover:bg-muted"
              >
                {step === 0 ? "Back to cart" : "← Back"}
              </button>
              {step < 2 ? (
                <button
                  onClick={next}
                  className="rounded-md bg-primary px-6
                    py-2.5 font-bold text-primary-foreground
                    hover:bg-primary-dark"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  className="rounded-md bg-primary px-6
                    py-2.5 font-bold text-primary-foreground
                    hover:bg-primary-dark"
                >
                  Pay {formatUSD(total)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---- ORDER SUMMARY SIDEBAR ---- */}
        {step < 3 && (
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-xl border border-border
              bg-card p-5"
            >
              <h3 className="font-extrabold">Order Summary</h3>
              <div className="mt-3 space-y-1.5 text-sm">
                <Row
                  label="Subtotal"
                  value={formatUSD(subtotal)}
                />
                <Row
                  label="Delivery"
                  value={
                    deliveryFee === 0
                      ? "FREE"
                      : formatUSD(deliveryFee)
                  }
                />
                <Row
                  label="VAT (15%)"
                  value={formatUSD(vat)}
                />
                {coupon && (
                  <Row
                    label={<span className="text-emerald-700">Coupon ({coupon.code})</span>}
                    value={<span className="text-emerald-700">-{formatUSD(discountAmount)}</span>}
                  />
                )}
                <div className="my-2 border-t border-border" />
                <Row
                  label={
                    <span className="text-base font-bold">
                      Total
                    </span>
                  }
                  value={
                    <span
                      className="text-lg font-extrabold"
                      style={{ color: "#0EA5E9" }}
                    >
                      {formatUSD(total)}
                    </span>
                  }
                />
              </div>

              <div className="mt-4 space-y-1">
                {items.slice(0, 3).map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-2
                      text-xs text-muted-foreground"
                  >
                    <div
                      className="h-6 w-6 flex-shrink-0
                        overflow-hidden rounded border
                        border-border bg-[#F9FAFB]"
                    >
                      <img
                        src={i.product.image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="truncate flex-1">
                      {i.product.name}
                    </span>
                    <span>×{i.qty}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{items.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ---- PAYMENT MODAL ---- */}
      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          amount={total}
          orderId={orderNumber}
          orderType="OTC"
          itemSummary={itemSummary}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold
        text-foreground"
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border
          bg-background px-3 py-2 text-sm outline-none
          focus:border-primary focus:ring-2
          focus:ring-primary/20"
      />
    </label>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function labelFor(method: string) {
  return (
    {
      ecocash: "EcoCash",
      onemoney: "OneMoney",
      telecash: "TeleCash",
      zimswitch: "ZimSwitch / Bank Card",
      bank_transfer: "Bank Transfer — ZIPIT",
    } as Record<string, string>
  )[method] ?? method;
}
