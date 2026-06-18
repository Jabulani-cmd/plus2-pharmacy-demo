// ============================================
// PAYMENT MODAL COMPONENT
// src/components/checkout/PaymentModal.tsx
// ============================================

import { useState } from "react";
import {
  X,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import {
  ZIM_PAYMENT_METHODS,
  DEMO_PAYMENT_DETAILS,
  generatePaymentRef,
  isMobileMoneyMethod,
  isBankTransfer,
} from "../../data/paymentMethods";

// ============================================
// TYPES
// ============================================

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentRef: string, method: string) => void;
  amount: number;
  orderId: string;
  rxRef?: string;
  orderType: "OTC" | "Prescription" | "Mixed";
  itemSummary: string;
}

// ============================================
// HELPERS
// ============================================

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const formatAmount = (amount: number) =>
  `$${amount.toFixed(2)}`;

// ============================================
// COMPONENT
// ============================================

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  orderId,
  rxRef,
  orderType,
  itemSummary,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState<
    Record<string, string>
  >({});
  const [status, setStatus] = useState<
    | "idle"
    | "processing"
    | "prompt_sent"
    | "success"
    | "failed"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedMethodData = ZIM_PAYMENT_METHODS.find(
    (m) => m.id === selectedMethod
  );

  const vat = parseFloat((amount * 0.15).toFixed(2));
  const subtotal = parseFloat((amount - vat).toFixed(2));

  // ---- Auto-fill demo data ----
  const fillDemo = () => {
    if (!selectedMethod) return;
    const demo =
      DEMO_PAYMENT_DETAILS[
        selectedMethod as keyof typeof DEMO_PAYMENT_DETAILS
      ];
    if (demo) setFormData(demo as Record<string, string>);
  };

  // ---- Copy to clipboard ----
  const copyToClipboard = async (
    value: string,
    key: string
  ) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // ---- Validate form ----
  const isFormValid = () => {
    if (!selectedMethod) return false;
    if (isBankTransfer(selectedMethod)) return true;
    const fields = selectedMethodData?.fields ?? [];
    return fields.every(
      (f) => formData[f.id] && formData[f.id].trim() !== ""
    );
  };

  // ---- Handle payment ----
  const handlePay = async () => {
    if (!selectedMethod || !isFormValid()) return;
    const ref = generatePaymentRef();
    setPaymentRef(ref);

    // Bank transfer — show details immediately
    if (isBankTransfer(selectedMethod)) {
      setStatus("prompt_sent");
      return;
    }

    // Mobile money — simulate prompt
    if (isMobileMoneyMethod(selectedMethod)) {
      setStatus("processing");
      setStatusMessage(
        `Sending payment prompt to ${formData.phone}...`
      );
      await delay(1500);

      setStatus("prompt_sent");
      setStatusMessage(
        `A payment request of ${formatAmount(amount)} has been ` +
          `sent to ${formData.phone}. ` +
          `Please check your phone and enter your PIN to confirm.`
      );
      await delay(4000);

      setStatus("processing");
      setStatusMessage("Confirming your payment...");
      await delay(2000);

      setStatus("success");
      return;
    }

    // ZimSwitch card
    if (selectedMethod === "zimswitch") {
      setStatus("processing");
      setStatusMessage(
        "Connecting to ZimSwitch payment network..."
      );
      await delay(1000);

      setStatusMessage("Verifying card details...");
      await delay(1200);

      setStatusMessage("Authorising transaction...");
      await delay(1500);

      setStatus("success");
      return;
    }
  };

  // ---- Reset and close ----
  const handleClose = () => {
    if (status === "processing") return;
    setSelectedMethod(null);
    setFormData({});
    setStatus("idle");
    setStatusMessage("");
    setPaymentRef("");
    onClose();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center
        justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full
          max-w-md max-h-[92vh] overflow-y-auto"
      >
        {/* ---- HEADER ---- */}
        <div
          className="flex items-center justify-between
            px-6 py-4 border-b border-gray-200 sticky top-0
            bg-white z-10"
        >
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {status === "success"
                ? "Payment Successful"
                : "Complete Payment"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {orderId}
              {rxRef ? ` · ${rxRef}` : ""}
            </p>
          </div>
          {status !== "processing" && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100
                transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* ---- ORDER SUMMARY ---- */}
        <div
          className="mx-6 mt-4 p-4 rounded-lg"
          style={{
            background: "#F0F9F4",
            border: "1px solid #BBF7D0",
          }}
        >
          <div className="flex justify-between items-start
            gap-4"
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase
                  tracking-wide mb-1"
                style={{ color: "#0EA5E9" }}
              >
                Order Summary
              </p>
              <p className="text-sm text-gray-600 leading-snug">
                {itemSummary}
              </p>
              {orderType === "Prescription" && (
                <span
                  className="inline-block mt-1 px-2 py-0.5
                    rounded-full text-xs font-semibold
                    bg-purple-100 text-purple-700"
                >
                  Prescription Order
                </span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">Subtotal</p>
              <p className="text-sm text-gray-700">
                {formatAmount(subtotal)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                VAT (15%)
              </p>
              <p className="text-sm text-gray-700">
                {formatAmount(vat)}
              </p>
              <p
                className="text-xs font-semibold uppercase
                  tracking-wide mt-1"
                style={{ color: "#0EA5E9" }}
              >
                Total
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: "#0EA5E9" }}
              >
                {formatAmount(amount)}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== */}
        {/* SUCCESS STATE        */}
        {/* ==================== */}
        {status === "success" && (
          <div className="p-6 text-center">
            <div
              className="w-16 h-16 rounded-full flex
                items-center justify-center mx-auto mb-4"
              style={{ background: "#F0F9F4" }}
            >
              <CheckCircle2
                size={40}
                style={{ color: "#0EA5E9" }}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900
              mb-1"
            >
              Payment Confirmed!
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Your payment of {formatAmount(amount)} has been
              successfully processed.
            </p>

            <div
              className="p-4 rounded-lg text-left mb-6"
              style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
              }}
            >
              {[
                ["Payment Reference", paymentRef],
                [
                  "Method",
                  selectedMethodData?.name ?? selectedMethod ?? "",
                ],
                ["Amount", formatAmount(amount)],
                ["Status", "Authorised"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between
                    items-center py-1.5 border-b
                    border-gray-100 last:border-0"
                >
                  <span className="text-xs text-gray-400">
                    {label}
                  </span>
                  <span
                    className="text-sm font-semibold
                      text-gray-900"
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                onSuccess(paymentRef, selectedMethod ?? "")
              }
              className="w-full py-3 rounded-lg text-white
                font-bold text-sm"
              style={{ background: "#0EA5E9" }}
            >
              View Order Confirmation
            </button>
          </div>
        )}

        {/* ==================== */}
        {/* PROCESSING STATE     */}
        {/* ==================== */}
        {(status === "processing" ||
          (status === "prompt_sent" &&
            !isBankTransfer(selectedMethod ?? ""))) && (
          <div className="p-8 text-center">
            {status === "processing" ? (
              <Loader2
                size={48}
                className="animate-spin mx-auto mb-4"
                style={{ color: "#0EA5E9" }}
              />
            ) : (
              <Smartphone
                size={48}
                className="mx-auto mb-4"
                style={{ color: "#0EA5E9" }}
              />
            )}
            <h3 className="text-base font-bold text-gray-900
              mb-2"
            >
              {status === "processing"
                ? "Processing Payment..."
                : "Check Your Phone"}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {statusMessage}
            </p>
            {status === "prompt_sent" && (
              <div
                className="mt-4 p-3 rounded-lg"
                style={{
                  background: "#FFF7ED",
                  border: "1px solid #FED7AA",
                }}
              >
                <p className="text-xs font-semibold
                  text-orange-700"
                >
                  Waiting for PIN confirmation...
                </p>
                <div className="flex justify-center gap-1
                  mt-2"
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full
                        bg-orange-400 animate-bounce"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== */}
        {/* BANK TRANSFER        */}
        {/* ==================== */}
        {status === "prompt_sent" &&
          isBankTransfer(selectedMethod ?? "") && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2
                size={20}
                style={{ color: "#0EA5E9" }}
              />
              <h3 className="font-bold text-gray-900 text-sm">
                ZIPIT Transfer Details
              </h3>
            </div>

            {[
              [
                "Bank",
                selectedMethodData?.bankDetails?.bankName ?? "",
              ],
              [
                "Account Name",
                selectedMethodData?.bankDetails?.accountName ??
                  "",
              ],
              [
                "Account Number",
                selectedMethodData?.bankDetails
                  ?.accountNumber ?? "",
              ],
              [
                "Branch Code",
                selectedMethodData?.bankDetails?.branchCode ??
                  "",
              ],
              [
                "Branch",
                selectedMethodData?.bankDetails?.branch ?? "",
              ],
              ["Payment Reference", paymentRef],
              ["Amount", formatAmount(amount)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between
                  items-center py-3 border-b border-gray-100"
              >
                <span className="text-xs text-gray-500">
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold
                    text-gray-900"
                  >
                    {value}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(value, label)
                    }
                    className="p-1 rounded hover:bg-gray-100
                      transition-colors"
                    title="Copy"
                  >
                    {copied === label ? (
                      <Check
                        size={12}
                        style={{ color: "#0EA5E9" }}
                      />
                    ) : (
                      <Copy
                        size={12}
                        className="text-gray-400"
                      />
                    )}
                  </button>
                </div>
              </div>
            ))}

            <div
              className="mt-4 p-3 rounded-lg"
              style={{
                background: "#FEF9C3",
                border: "1px solid #FDE68A",
              }}
            >
              <p className="text-xs text-yellow-800
                leading-relaxed"
              >
                ⚠ Always use reference{" "}
                <strong>{paymentRef}</strong> when making
                your transfer. Your order will be confirmed
                within 30 minutes of payment reflecting.
              </p>
            </div>

            <button
              onClick={() =>
                onSuccess(paymentRef, "bank_transfer")
              }
              className="w-full mt-4 py-3 rounded-lg
                text-white font-bold text-sm"
              style={{ background: "#0EA5E9" }}
            >
              I Have Made the Transfer
            </button>
          </div>
        )}

        {/* ==================== */}
        {/* FAILED STATE         */}
        {/* ==================== */}
        {status === "failed" && (
          <div className="p-8 text-center">
            <AlertCircle
              size={48}
              className="mx-auto mb-4 text-red-500"
            />
            <h3 className="text-base font-bold text-gray-900
              mb-2"
            >
              Payment Failed
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {statusMessage ||
                "Your payment could not be processed. " +
                  "Please try again."}
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setStatusMessage("");
              }}
              className="w-full py-3 rounded-lg text-white
                font-bold text-sm"
              style={{ background: "#0EA5E9" }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ==================== */}
        {/* IDLE — METHOD SELECT */}
        {/* ==================== */}
        {status === "idle" && (
          <div className="p-6">
            <p
              className="text-xs font-semibold uppercase
                tracking-wide text-gray-400 mb-3"
            >
              Select Payment Method
            </p>

            {/* Method cards */}
            <div className="space-y-2 mb-5">
              {ZIM_PAYMENT_METHODS.map((method) => {
                const isSelected =
                  selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setFormData({});
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                      isSelected
                        ? "border-[#0EA5E9] bg-[#F0F9F4]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: method.bgColor,
                        color: method.color,
                      }}
                    >
                      {method.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {method.name}
                        </p>
                        {method.popular && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {method.description}
                      </p>
                    </div>
                    {isMobileMoneyMethod(method.id) ? (
                      <Smartphone size={16} className="text-gray-400" />
                    ) : (
                      <Building2 size={16} className="text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected method form */}
            {selectedMethodData && !isBankTransfer(selectedMethod ?? "") && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">
                    {selectedMethodData.name} Details
                  </p>
                  <button
                    onClick={fillDemo}
                    className="text-xs font-semibold text-[#0EA5E9] hover:underline"
                  >
                    Use demo data
                  </button>
                </div>
                {selectedMethodData.fields.map((field) => (
                  <div key={field.id}>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.id] ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {field.hint}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {selectedMethodData && isBankTransfer(selectedMethod ?? "") && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
                Click "Pay Now" to view ZIPIT transfer details.
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!isFormValid()}
              className="w-full py-3 rounded-lg text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "#0EA5E9" }}
            >
              <ShieldCheck size={16} />
              Pay {formatAmount(amount)}
            </button>

            <p className="mt-3 text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
              <Clock size={11} /> Secure payment processing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
