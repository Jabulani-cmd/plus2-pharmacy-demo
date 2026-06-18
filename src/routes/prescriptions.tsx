import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import PaymentModal from "@/components/checkout/PaymentModal";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";
import {
  Camera,
  Image as ImageIcon,
  Mail,
  ChevronRight,
  Upload,
  X,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Truck,
  Store,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/prescriptions")({
  head: () => ({
    meta: [{ title: "Upload Prescription — Kings Pharmacy" }],
  }),
  component: PrescriptionsPage,
});

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPTED =
  "image/jpeg,image/png,image/heic,image/heif,application/pdf";

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const ZIMBABWE_CITIES = [
  "Bulawayo","Bulawayo","Chitungwiza","Mutare","Gweru",
  "Kwekwe","Kadoma","Masvingo","Chinhoyi","Marondera",
  "Norton","Chegutu","Bindura","Beitbridge","Redcliff",
  "Victoria Falls","Hwange","Rusape","Zvishavane","Kariba",
];

const ZIMBABWE_PROVINCES = [
  "Bulawayo Metropolitan","Bulawayo Metropolitan","Manicaland",
  "Mashonaland Central","Mashonaland East","Mashonaland West",
  "Masvingo","Matabeleland North","Matabeleland South",
  "Midlands",
];

const COLLECTION_BRANCHES = [
  {
    id: "harare_cbd",
    name: "Bulawayo CBD Branch",
    address:
      "Shop 14, Joina City Mall, Corner Jason Moyo Ave " +
      "& Inez Terrace, Bulawayo CBD",
    hours: "Mon–Fri 8am–6pm | Sat 8am–2pm",
    phone: "+263 24 2 756 100",
  },
  {
    id: "borrowdale",
    name: "Borrowdale Branch",
    address:
      "Shop 6, Borrowdale Village, Borrowdale Road, " +
      "Borrowdale, Bulawayo",
    hours: "Mon–Fri 8am–6pm | Sat 8am–2pm",
    phone: "+263 24 2 885 200",
  },
  {
    id: "bulawayo",
    name: "Bulawayo Branch",
    address:
      "Shop 23, Haddon & Sly Centre, Corner 9th Ave " +
      "& Jason Moyo Street, Bulawayo",
    hours: "Mon–Fri 8am–6pm | Sat 8am–2pm",
    phone: "+263 29 2 884 300",
  },
];

type LocalFile = {
  id: string;
  file: File;
  preview?: string;
  error?: string;
};

type DeliveryMode = "delivery" | "collect";

type AddressData = {
  firstName: string;
  lastName: string;
  phone: string;
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  specialInstructions: string;
};

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

// ============================================================
// PAGE
// ============================================================
function PrescriptionsPage() {
  const user = useAuth((s) => s.user);
  const addPrescription = useAuth((s) => s.addPrescription);
  const navigate = useNavigate();

  const sharedPrescriptions = useSharedPrescriptions(
    (s) => s.prescriptions
  );
  const markSharedPaid = useSharedPrescriptions(
    (s) => s.markPaid
  );

  // ✅ FIXED: missing angle bracket after useState
  const [payingRx, setPayingRx] = useState<(typeof sharedPrescriptions)[0] | null>(null);

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  if (!user) return null;

  // Show banners for prescriptions awaiting payment
  const pendingPayment = sharedPrescriptions.filter(
    (p) =>
      (p.customerId === user.id ||
        p.customerEmail === user.email) &&
      p.status === "Approved — Awaiting Payment" &&
      p.quotation
  );

  // All prescriptions for this customer for recent list
  const myPrescriptions = sharedPrescriptions.filter(
    (p) =>
      p.customerId === user.id ||
      p.customerEmail === user.email
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 md:pb-8">

      {/* Payment notification banners */}
      {pendingPayment.map((rx) => (
        <div
          key={rx.id}
          className="mb-4 rounded-lg p-4 flex items-start gap-3"
          style={{
            background: "#F0F9F4",
            border: "2px solid #0EA5E9",
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "#0EA5E9" }}
          >
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#111827] text-sm">
              Prescription Approved — Payment Required
            </p>
            <p className="text-xs text-[#374151] mt-0.5">
              {rx.quotation?.medicationName} approved by{" "}
              {rx.quotation?.pharmacistName}
            </p>
            {rx.quotation && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <span className="text-[#6B7280]">
                  Medication: $
                  {rx.quotation.medicationCost.toFixed(2)}
                </span>
                {rx.quotation.deliveryFee > 0 && (
                  <span className="text-[#6B7280]">
                    Delivery: $
                    {rx.quotation.deliveryFee.toFixed(2)}
                  </span>
                )}
                <span className="font-bold text-[#0EA5E9]">
                  Total: ${rx.quotation.total.toFixed(2)}
                </span>
              </div>
            )}
            {rx.quotation?.notes && (
              <p className="mt-1 text-xs text-[#6B7280] italic">
                "{rx.quotation.notes}"
              </p>
            )}
          </div>
          <button
            onClick={() => setPayingRx(rx)}
            className="shrink-0 rounded-md px-4 py-2 text-sm font-bold text-white"
            style={{ background: "#0EA5E9" }}
          >
            Pay Now
          </button>
        </div>
      ))}

      {/* Page heading */}
      <div className="mb-5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">
          Pharmacy Services
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
          Upload Your Prescription
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          A registered Kings pharmacist will review your script
          within 2 hours (Mon–Sat 8am–6pm).
        </p>
      </div>

      <UploadWizard
        onSubmit={addPrescription}
        user={user}
      />

      {myPrescriptions.length > 0 && (
        <RecentScripts list={myPrescriptions.slice(0, 5)} />
      )}

      {/* Payment modal */}
      {payingRx && payingRx.quotation && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPayingRx(null)}
          onSuccess={(ref, method) => {
            markSharedPaid(payingRx.id, ref, method);
            setPayingRx(null);
            toast.success(
              "Payment confirmed — your medication will " +
              "be dispatched shortly"
            );
          }}
          amount={payingRx.quotation.total}
          orderId={payingRx.id}
          rxRef={payingRx.id}
          orderType="Prescription"
          itemSummary={
            payingRx.quotation.medicationName +
            " · " +
            payingRx.quotation.quantity +
            " · Approved by " +
            payingRx.quotation.pharmacistName
          }
        />
      )}
    </div>
  );
}

// ============================================================
// WIZARD
// ============================================================
function UploadWizard({
  onSubmit,
  user,
}: {
  onSubmit: ReturnType<typeof useAuth.getState>["addPrescription"];
  user: NonNullable<ReturnType<typeof useAuth.getState>["user"]>;
}) {
  const addSharedPrescription = useSharedPrescriptions(
    (s) => s.addPrescription
  );

  const [step, setStep] = useState<WizardStep>(1);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [forSelf, setForSelf] = useState(true);
  const [patient, setPatient] = useState("");
  const [relationship, setRelationship] = useState("Spouse");
  const [doctor, setDoctor] = useState("");
  const [scriptDate, setScriptDate] = useState("");
  const [isRepeat, setIsRepeat] = useState(false);
  const [repeatsLeft, setRepeatsLeft] = useState(1);
  const [notes, setNotes] = useState("");
  const [deliveryMode, setDeliveryMode] =
    useState<DeliveryMode>("delivery");
  const [selectedBranch, setSelectedBranch] = useState(
    COLLECTION_BRANCHES[0].id
  );
  const [address, setAddress] = useState<AddressData>({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    streetAddress: "",
    suburb: "",
    city: "Bulawayo",
    province: "Bulawayo Metropolitan",
    postalCode: "",
    specialInstructions: "",
  });
  const [confirm, setConfirm] = useState(false);
  const [refId, setRefId] = useState<string | null>(null);

  const validFiles = files.filter((f) => !f.error);
  const canNext1 = validFiles.length > 0;
  const canNext2 =
    (forSelf || patient.trim().length > 0) &&
    scriptDate.length > 0;
  const canNext4 =
    deliveryMode === "collect"
      ? true
      : address.firstName.trim().length > 0 &&
        address.lastName.trim().length > 0 &&
        address.phone.trim().length > 0 &&
        address.streetAddress.trim().length > 0 &&
        address.suburb.trim().length > 0;
  const canSubmit = confirm;

  const deliveryFee = deliveryMode === "collect" ? 0 : 15.0;
  const branch = COLLECTION_BRANCHES.find(
    (b) => b.id === selectedBranch
  );

  const goToStep = (s: WizardStep) => setStep(s);

  const handleNext = () => {
    if (step === 3 && deliveryMode === "collect") {
      goToStep(5);
    } else if (step < 6) {
      goToStep((step + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (step === 5 && deliveryMode === "collect") {
      goToStep(3);
    } else if (step > 1) {
      goToStep((step - 1) as WizardStep);
    }
  };

  const isNextDisabled =
    (step === 1 && !canNext1) ||
    (step === 2 && !canNext2) ||
    (step === 4 && !canNext4);

  const nextLabel = () => {
    if (step === 1) return "Next: Patient Details";
    if (step === 2) return "Next: Delivery Method";
    if (step === 3)
      return deliveryMode === "delivery"
        ? "Next: Delivery Address"
        : "Next: Review";
    if (step === 4) return "Next: Review";
    return "Next";
  };

  const submit = () => {
    const id = onSubmit({
      fileName: validFiles[0]?.file.name ?? "script",
      patientName: forSelf
        ? user.firstName + " " + user.lastName
        : patient.trim(),
      doctorName: doctor.trim() || "—",
      notes: notes.trim() || undefined,
      files: validFiles.map((f) => ({
        name: f.file.name,
        size: f.file.size,
        type: f.file.type,
        dataUrl: f.preview,
      })),
      forSelf,
      relationship: forSelf ? undefined : relationship,
      scriptDate,
      isRepeat,
      repeatsLeft: isRepeat ? repeatsLeft : undefined,
      delivery: deliveryMode,
      deliveryAddress:
        deliveryMode === "delivery" ? address : undefined,
      collectionBranchId:
        deliveryMode === "collect" ? selectedBranch : undefined,
    });

    // Save to shared store so pharmacist can see it
    addSharedPrescription({
      id,
      customerId: user.id,
      customerName: user.firstName + " " + user.lastName,
      customerEmail: user.email,
      customerPhone: user.phone ?? "",
      fileName: validFiles[0]?.file.name ?? "script",
      patientName: forSelf
        ? user.firstName + " " + user.lastName
        : patient.trim(),
      doctorName: doctor.trim() || "—",
      notes: notes.trim() || undefined,
      files: validFiles.map((f) => ({
        name: f.file.name,
        size: f.file.size,
        type: f.file.type,
        dataUrl: f.preview,
      })),
      forSelf,
      relationship: forSelf ? undefined : relationship,
      scriptDate,
      isRepeat,
      repeatsLeft: isRepeat ? repeatsLeft : undefined,
      delivery: deliveryMode,
      deliveryAddress:
        deliveryMode === "delivery" ? address : undefined,
      collectionBranchId:
        deliveryMode === "collect" ? selectedBranch : undefined,
    });

    setRefId(id);
    setStep(6);
    toast.success(
      "Prescription submitted — our pharmacist will review " +
      "within 2 hours and send you a payment quotation"
    );
  };

  const stepperLabels =
    deliveryMode === "collect"
      ? ["Files", "Patient", "Collection", "Review", "Done"]
      : [
          "Files","Patient","Delivery",
          "Address","Review","Done",
        ];

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
      <StepperBar
        step={step}
        labels={stepperLabels}
        deliveryMode={deliveryMode}
      />

      <div className="p-5 md:p-6">
        {step === 1 && (
          <Step1Files files={files} setFiles={setFiles} />
        )}
        {step === 2 && (
          <Step2Patient
            forSelf={forSelf} setForSelf={setForSelf}
            patient={patient} setPatient={setPatient}
            relationship={relationship}
            setRelationship={setRelationship}
            doctor={doctor} setDoctor={setDoctor}
            scriptDate={scriptDate}
            setScriptDate={setScriptDate}
            isRepeat={isRepeat} setIsRepeat={setIsRepeat}
            repeatsLeft={repeatsLeft}
            setRepeatsLeft={setRepeatsLeft}
            notes={notes} setNotes={setNotes}
          />
        )}
        {step === 3 && (
          <Step3Delivery
            deliveryMode={deliveryMode}
            setDeliveryMode={setDeliveryMode}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
          />
        )}
        {step === 4 && (
          <Step4Address
            address={address}
            setAddress={setAddress}
          />
        )}
        {step === 5 && (
          <Step5Review
            files={validFiles}
            forSelf={forSelf} patient={patient}
            relationship={relationship} doctor={doctor}
            scriptDate={scriptDate} isRepeat={isRepeat}
            repeatsLeft={repeatsLeft}
            deliveryMode={deliveryMode}
            address={address} branch={branch}
            deliveryFee={deliveryFee}
            confirm={confirm} setConfirm={setConfirm}
          />
        )}
        {step === 6 && refId && (
          <Step6Success
            refId={refId}
            deliveryMode={deliveryMode}
            address={address}
            branch={branch}
          />
        )}
      </div>

      {step < 6 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-[#E5E7EB] bg-white p-4 md:rounded-b-lg">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 5 && (
            <button
              disabled={isNextDisabled}
              onClick={handleNext}
              className="flex-1 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 md:flex-initial md:px-8"
            >
              {nextLabel()}
            </button>
          )}
          {step === 5 && (
            <button
              disabled={!canSubmit}
              onClick={submit}
              className="flex-1 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 md:flex-initial md:px-8"
            >
              Submit Prescription
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEPPER
// ============================================================
function StepperBar({
  step, labels, deliveryMode,
}: {
  step: number;
  labels: string[];
  deliveryMode: DeliveryMode;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 py-3 md:px-5">
      {labels.map((l, i) => {
        const idx = i + 1;
        const realStep =
          deliveryMode === "collect" && idx >= 4
            ? idx + 1
            : idx;
        const done = realStep < step;
        const active = realStep === step;
        return (
          <div key={l} className="flex shrink-0 items-center gap-1.5">
            <div
              className={
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " +
                (done || active
                  ? "bg-primary text-white"
                  : "bg-[#E5E7EB] text-[#6B7280]")
              }
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : idx}
            </div>
            <span
              className={
                "hidden text-[11px] font-semibold uppercase tracking-wide md:inline whitespace-nowrap " +
                (active ? "text-primary" : done ? "text-[#374151]" : "text-[#9CA3AF]")
              }
            >
              {l}
            </span>
            {idx < labels.length && (
              <div
                className={
                  "h-px w-4 shrink-0 md:w-8 " +
                  (done ? "bg-primary" : "bg-[#E5E7EB]")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// STEP 1 — FILES
// ============================================================
function Step1Files({
  files, setFiles,
}: {
  files: LocalFile[];
  setFiles: (f: LocalFile[]) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cloudRef = useRef<HTMLInputElement>(null);
  const isMobile = isMobileDevice();

  const hasHeic = useMemo(
    () =>
      files.some(
        (f) =>
          /heic|heif/i.test(f.file.type) ||
          /\.(heic|heif)$/i.test(f.file.name)
      ),
    [files]
  );

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const next: LocalFile[] = [...files];
    for (const f of incoming) {
      if (next.length >= MAX_FILES) {
        toast.error("Maximum " + MAX_FILES + " files");
        break;
      }
      const error =
        f.size > MAX_BYTES ? "File too large — max 10MB" : undefined;
      const local: LocalFile = {
        id: crypto.randomUUID(), file: f, error,
      };
      if (!error && f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          local.preview = reader.result as string;
          setFiles([...next]);
        };
        reader.readAsDataURL(f);
      }
      next.push(local);
    }
    setFiles(next);
  };

  const remove = (id: string) =>
    setFiles(files.filter((f) => f.id !== id));

  const totalMB = (
    files.reduce((s, f) => s + f.file.size, 0) / 1024 / 1024
  ).toFixed(1);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#111827]">
          Add your script
        </h2>
        <p className="text-sm text-[#6B7280]">
          Choose how you'd like to upload your prescription.
        </p>
      </div>

      {!isMobile && (
        <div
          className="flex items-start gap-3 rounded-lg p-3 text-sm"
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
        >
          <span className="text-base">💡</span>
          <span className="text-[#1E40AF]">
            <strong>On a desktop?</strong> Use "Choose from Gallery or Files" or drag and drop. Camera is mobile only.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MethodCard
          icon={Camera}
          title="Take a Photo"
          subtitle={isMobile ? "Open camera to photograph your script" : "Mobile devices only"}
          onClick={() => {
            if (isMobile) { cameraRef.current?.click(); }
            else { toast.info("Camera is only available on mobile. Please use the file picker."); }
          }}
          disabled={!isMobile}
          badge={isMobile ? undefined : "Mobile only"}
          badgeColor="#854D0E"
          badgeBg="#FEF9C3"
        />
        <MethodCard
          icon={ImageIcon}
          title="Choose from Gallery or Files"
          subtitle="Select a photo, PDF or image from your device"
          onClick={() => galleryRef.current?.click()}
        />
        <MethodCard
          icon={Mail}
          title="From Email or Cloud Storage"
          subtitle="Access from Gmail, Outlook, Google Drive or iCloud"
          onClick={() => cloudRef.current?.click()}
        />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary","bg-[#F0F9F4]"); }}
        onDragLeave={(e) => e.currentTarget.classList.remove("border-primary","bg-[#F0F9F4]")}
        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-primary","bg-[#F0F9F4]"); handleFiles(e.dataTransfer.files); }}
        className="hidden h-[160px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] transition hover:border-primary hover:bg-[#F0F9F4] md:flex"
        onClick={() => galleryRef.current?.click()}
      >
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-[#9CA3AF]" />
          <div className="mt-2 text-sm font-semibold text-[#374151]">Drag &amp; drop files here</div>
          <div className="mt-1 text-xs text-[#9CA3AF]">JPG, PNG, PDF — Max 10MB</div>
        </div>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={galleryRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={cloudRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {hasHeic && (
        <div className="flex items-start gap-2 rounded-md border border-[#FDE68A] bg-[#FEFCE8] p-3 text-xs text-[#854D0E]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>iPhone HEIC format detected — will be converted automatically.</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {files.map((f) => (
              <div
                key={f.id}
                className={"relative aspect-square overflow-hidden rounded-lg border bg-[#F9FAFB] " + (f.error ? "border-[#DC2626]" : "border-[#E5E7EB]")}
              >
                {f.preview ? (
                  <img src={f.preview} alt={f.file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center">
                    <FileText className="h-10 w-10 text-primary" />
                    <span className="truncate text-[10px] font-medium text-[#374151]">{f.file.name}</span>
                  </div>
                )}
                <button onClick={() => remove(f.id)} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#374151] shadow hover:bg-[#FEE2E2] hover:text-[#DC2626]">
                  <X className="h-3.5 w-3.5" />
                </button>
                <span className="absolute bottom-2 left-2 rounded-[3px] bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {(f.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                {f.error && (
                  <div className="absolute inset-x-0 bottom-0 bg-[#DC2626] px-2 py-1 text-center text-[10px] font-semibold text-white">{f.error}</div>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={files.length >= MAX_FILES}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-[#F0F9F4] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Another Script
            </button>
            <span>{files.length} file{files.length !== 1 ? "s" : ""} (max {MAX_FILES}) · {totalMB} MB</span>
          </div>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
        <ShieldCheck className="h-3 w-3 text-primary" /> Files encrypted — only viewed by a registered pharmacist.
      </p>
    </div>
  );
}

// ============================================================
// METHOD CARD
// ============================================================
function MethodCard({
  icon: Icon, title, subtitle, onClick,
  disabled = false, badge, badgeColor, badgeBg,
}: {
  icon: typeof Camera;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ minHeight: 80 }}
      className={"flex w-full items-center gap-4 rounded-lg border px-5 py-4 text-left transition " + (disabled ? "cursor-default border-[#E5E7EB] bg-[#F9FAFB] opacity-60" : "border-[#E5E7EB] bg-white hover:border-primary hover:bg-[#F9FAFB]")}
    >
      <span className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-lg " + (disabled ? "bg-[#F3F4F6]" : "bg-[#F0F9F4]")}>
        <Icon className={"h-7 w-7 " + (disabled ? "text-[#9CA3AF]" : "text-primary")} />
      </span>
      <span className="flex-1">
        <span className={"block text-[15px] font-semibold " + (disabled ? "text-[#6B7280]" : "text-[#111827]")}>{title}</span>
        <span className="block text-[12px] text-[#6B7280]">{subtitle}</span>
        {badge && (
          <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: badgeBg ?? "#F3F4F6", color: badgeColor ?? "#374151" }}>
            {badge}
          </span>
        )}
      </span>
      <ChevronRight className={"h-[18px] w-[18px] shrink-0 " + (disabled ? "text-[#D1D5DB]" : "text-[#9CA3AF]")} />
    </button>
  );
}

// ============================================================
// STEP 2 — PATIENT
// ============================================================
function Step2Patient(props: {
  forSelf: boolean; setForSelf: (v: boolean) => void;
  patient: string; setPatient: (v: string) => void;
  relationship: string; setRelationship: (v: string) => void;
  doctor: string; setDoctor: (v: string) => void;
  scriptDate: string; setScriptDate: (v: string) => void;
  isRepeat: boolean; setIsRepeat: (v: boolean) => void;
  repeatsLeft: number; setRepeatsLeft: (v: number) => void;
  notes: string; setNotes: (v: string) => void;
}) {
  const { forSelf, setForSelf, patient, setPatient, relationship, setRelationship, doctor, setDoctor, scriptDate, setScriptDate, isRepeat, setIsRepeat, repeatsLeft, setRepeatsLeft, notes, setNotes } = props;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#111827]">Patient Details</h2>
        <p className="text-sm text-[#6B7280]">Tell us who this prescription is for.</p>
      </div>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#374151]">Who is this prescription for?</label>
        <div className="grid grid-cols-2 gap-3">
          <ToggleBtn active={forSelf} onClick={() => setForSelf(true)}>Myself</ToggleBtn>
          <ToggleBtn active={!forSelf} onClick={() => setForSelf(false)}>Someone else</ToggleBtn>
        </div>
      </div>
      {!forSelf && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient full name" value={patient} onChange={(e) => setPatient(e.target.value)} required />
          <SelectField label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} options={["Spouse","Child","Parent","Sibling","Other"]} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Doctor / Prescriber (optional)" value={doctor} onChange={(e) => setDoctor(e.target.value)} />
        <Field label="Date on prescription" type="date" value={scriptDate} onChange={(e) => setScriptDate(e.target.value)} required />
      </div>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#374151]">Repeat prescription?</label>
        <div className="grid grid-cols-2 gap-3">
          <ToggleBtn active={!isRepeat} onClick={() => setIsRepeat(false)}>No</ToggleBtn>
          <ToggleBtn active={isRepeat} onClick={() => setIsRepeat(true)}>Yes</ToggleBtn>
        </div>
        {isRepeat && (
          <div className="mt-3">
            <Field label="Repeats remaining" type="number" min={1} max={12} value={repeatsLeft} onChange={(e) => setRepeatsLeft(Number(e.target.value) || 1)} />
          </div>
        )}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#374151]">Notes to pharmacist</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={300} placeholder="Specific instructions, preferred generics, questions..." className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        <span className="mt-1 block text-right text-[10px] text-[#9CA3AF]">{notes.length}/300</span>
      </label>
    </div>
  );
}

// ============================================================
// STEP 3 — DELIVERY METHOD
// ============================================================
function Step3Delivery({
  deliveryMode, setDeliveryMode, selectedBranch, setSelectedBranch,
}: {
  deliveryMode: DeliveryMode;
  setDeliveryMode: (v: DeliveryMode) => void;
  selectedBranch: string;
  setSelectedBranch: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#111827]">Delivery Method</h2>
        <p className="text-sm text-[#6B7280]">How would you like to receive your medication?</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DeliveryOption active={deliveryMode === "delivery"} onClick={() => setDeliveryMode("delivery")} icon={Truck} title="Home Delivery" subtitle="Delivered to your door · $15.00" badge="Door to door" />
        <DeliveryOption active={deliveryMode === "collect"} onClick={() => setDeliveryMode("collect")} icon={Store} title="Collect In-Store" subtitle="Ready for collection · FREE" badge="FREE" />
      </div>
      {deliveryMode === "collect" && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#374151]">Select your collection branch</p>
          {COLLECTION_BRANCHES.map((b) => (
            <button key={b.id} type="button" onClick={() => setSelectedBranch(b.id)}
              className={"w-full rounded-lg border p-4 text-left transition " + (selectedBranch === b.id ? "border-primary bg-[#F0F9F4]" : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]")}
            >
              <div className="flex items-start gap-3">
                <div className={"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + (selectedBranch === b.id ? "bg-primary text-white" : "bg-[#F0F9F4] text-primary")}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#111827]">{b.name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{b.address}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{b.hours}</p>
                  <p className="text-xs text-primary mt-0.5 font-medium">{b.phone}</p>
                </div>
                <div className={"mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center " + (selectedBranch === b.id ? "border-primary bg-primary" : "border-[#D1D5DB]")}>
                  {selectedBranch === b.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
          <div className="rounded-lg p-3 text-xs" style={{ background: "#F0F9F4", border: "1px solid #BBF7D0" }}>
            <p className="font-semibold text-[#0EA5E9]">Collection ready within 2–4 hours after payment</p>
            <p className="text-[#374151] mt-0.5">Bring your National ID and order reference number when collecting.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP 4 — ADDRESS
// ============================================================
function Step4Address({
  address, setAddress,
}: {
  address: AddressData;
  setAddress: (v: AddressData) => void;
}) {
  const update = (field: keyof AddressData, value: string) =>
    setAddress({ ...address, [field]: value });
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#111827]">Delivery Address</h2>
        <p className="text-sm text-[#6B7280]">Enter where you'd like your medication delivered in Zimbabwe.</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg p-3 text-xs" style={{ background: "#F0F9F4", border: "1px solid #BBF7D0" }}>
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-[#374151]">Fields marked <span className="text-[#DC2626] font-semibold">*</span> are required.</span>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#374151]">Contact Details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name *" value={address.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Tinashe" required />
          <Field label="Last Name *" value={address.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Mapfumo" required />
        </div>
        <div className="mt-4">
          <Field label="Phone Number *" value={address.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+263 77 123 4567" type="tel" required />
          <p className="mt-1 text-[11px] text-[#9CA3AF]">We will SMS this number with delivery updates</p>
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#374151]">Address Details</p>
        <div className="space-y-4">
          <Field label="Street Address *" value={address.streetAddress} onChange={(e) => update("streetAddress", e.target.value)} placeholder="14 Borrowdale Road" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Suburb *" value={address.suburb} onChange={(e) => update("suburb", e.target.value)} placeholder="Borrowdale" required />
            <Field label="Postal Code" value={address.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="263" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#374151]">City *</span>
              <select value={address.city} onChange={(e) => update("city", e.target.value)} className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {ZIMBABWE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#374151]">Province</span>
              <select value={address.province} onChange={(e) => update("province", e.target.value)} className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {ZIMBABWE_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#374151]">Special Delivery Instructions (optional)</span>
        <textarea value={address.specialInstructions} onChange={(e) => update("specialInstructions", e.target.value)} rows={2} maxLength={200} placeholder="e.g. Call on arrival, leave with security, gate code 1234..." className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        <span className="mt-1 block text-right text-[10px] text-[#9CA3AF]">{address.specialInstructions.length}/200</span>
      </label>
      <div className="flex items-center justify-between rounded-lg p-4" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-[#111827]">Home Delivery Fee</span>
        </div>
        <span className="text-lg font-bold" style={{ color: "#0EA5E9" }}>$15.00</span>
      </div>
    </div>
  );
}

// ============================================================
// STEP 5 — REVIEW
// ============================================================
function Step5Review(props: {
  files: LocalFile[];
  forSelf: boolean; patient: string; relationship: string;
  doctor: string; scriptDate: string; isRepeat: boolean;
  repeatsLeft: number; deliveryMode: DeliveryMode;
  address: AddressData;
  branch: typeof COLLECTION_BRANCHES[0] | undefined;
  deliveryFee: number; confirm: boolean;
  setConfirm: (v: boolean) => void;
}) {
  const { files, forSelf, patient, relationship, doctor, scriptDate, isRepeat, repeatsLeft, deliveryMode, address, branch, deliveryFee, confirm, setConfirm } = props;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#111827]">Review & Submit</h2>
        <p className="text-sm text-[#6B7280]">Confirm the details below before submitting.</p>
      </div>

      <div className="rounded-lg p-4" style={{ background: "#F0F9F4", border: "1px solid #BBF7D0" }}>
        <p className="font-semibold text-sm text-[#0EA5E9] mb-2">What happens after you submit?</p>
        <ol className="space-y-1.5 text-xs text-[#374151]">
          {[
            "Our pharmacist reviews your script (within 2 hours)",
            "You receive a payment quotation with medication cost",
            "Pay via EcoCash, OneMoney, ZimSwitch or Bank Transfer",
            deliveryMode === "delivery" ? "Medication dispatched to your address" : "Collect from your chosen branch after payment",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <Section title="Scripts Uploaded">
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F9FAFB]">
              {f.preview ? <img src={f.preview} alt="" className="h-full w-full object-cover" /> : <FileText className="h-6 w-6 text-primary" />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">{files.length} file{files.length !== 1 ? "s" : ""} uploaded</p>
      </Section>

      <Section title="Patient">
        <DL items={[
          ["For", forSelf ? "Myself" : patient + (relationship ? " (" + relationship + ")" : "")],
          ["Doctor", doctor || "—"],
          ["Date on script", scriptDate],
          ["Repeat", isRepeat ? "Yes (" + repeatsLeft + " remaining)" : "No"],
        ]} />
      </Section>

      <Section title="Delivery">
        {deliveryMode === "delivery" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-[#111827]">Home Delivery</span>
            </div>
            <DL items={[
              ["Name", address.firstName + " " + address.lastName],
              ["Phone", address.phone],
              ["Address", address.streetAddress],
              ["Suburb", address.suburb],
              ["City", address.city + ", " + address.province],
              ...(address.specialInstructions ? [["Instructions", address.specialInstructions] as [string,string]] : []),
            ]} />
            <div className="flex items-center justify-between rounded-md p-2 mt-2" style={{ background: "#F0F9F4" }}>
              <span className="text-xs text-[#6B7280]">Delivery fee</span>
              <span className="text-sm font-bold text-[#0EA5E9]">$15.00</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-[#111827]">Collect In-Store — FREE</span>
            </div>
            {branch && (
              <div>
                <p className="text-sm font-medium text-[#374151]">{branch.name}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{branch.address}</p>
                <p className="text-xs text-[#6B7280]">{branch.hours}</p>
              </div>
            )}
          </div>
        )}
      </Section>

      <div className="flex items-start gap-2 rounded-md border border-[#FDE68A] bg-[#FEF3C7] p-3 text-xs text-[#854D0E]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Ensure your prescription is valid, dated and signed by a registered healthcare professional. Submitting a forged script is a criminal offence under Zimbabwean law.</span>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0EA5E9]" />
        <span className="text-[#374151]">I confirm this is a genuine, valid prescription issued by a registered healthcare professional in Zimbabwe.</span>
      </label>
    </div>
  );
}

// ============================================================
// STEP 6 — SUCCESS
// ============================================================
function Step6Success({
  refId, deliveryMode, address, branch,
}: {
  refId: string;
  deliveryMode: DeliveryMode;
  address: AddressData;
  branch: typeof COLLECTION_BRANCHES[0] | undefined;
}) {
  const stages = [
    "Submitted","Under Review","Quotation Sent",
    "Payment Received","Dispensing",
    deliveryMode === "delivery" ? "Out for Delivery" : "Ready to Collect",
    deliveryMode === "delivery" ? "Delivered" : "Collected",
  ];

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0F9F4]">
        <CheckCircle2 className="h-12 w-12 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#111827]">Prescription Submitted Successfully</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Reference: <span className="font-mono font-semibold text-[#111827]">{refId}</span>
        </p>
      </div>

      <div className="mx-auto max-w-sm rounded-lg p-4 text-left" style={{ background: "#F0F9F4", border: "1px solid #BBF7D0" }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#0EA5E9" }}>What Happens Next</p>
        <ol className="space-y-2 text-xs text-[#374151]">
          {[
            "Pharmacist reviews your script within 2 hours (Mon–Sat 8am–6pm)",
            "You receive a notification with your medication cost and payment link",
            "Pay via EcoCash, OneMoney, TeleCash, ZimSwitch or Bank Transfer",
            deliveryMode === "delivery"
              ? "Medication dispatched to " + address.suburb + ", " + address.city
              : "Collect from " + (branch?.name ?? "your chosen branch"),
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={"flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " + (i === 0 ? "bg-primary text-white" : "bg-[#E5E7EB] text-[#6B7280]")}>
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto max-w-sm rounded-lg p-4 text-left" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
          {deliveryMode === "delivery" ? "Delivery Address" : "Collection Branch"}
        </p>
        {deliveryMode === "delivery" ? (
          <div className="space-y-0.5 text-xs text-[#374151]">
            <p className="font-medium text-[#111827]">{address.firstName} {address.lastName}</p>
            <p>{address.streetAddress}, {address.suburb}</p>
            <p>{address.city}, Zimbabwe</p>
            <p>{address.phone}</p>
          </div>
        ) : branch ? (
          <div className="space-y-0.5 text-xs text-[#374151]">
            <p className="font-medium text-[#111827]">{branch.name}</p>
            <p>{branch.address}</p>
            <p>{branch.hours}</p>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-2">
        <ol className="mx-auto flex min-w-[560px] items-center gap-1 px-2">
          {stages.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-1">
              <div className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " + (i === 0 ? "bg-primary text-white" : "bg-[#E5E7EB] text-[#6B7280]")}>
                {i + 1}
              </div>
              <span className={"text-[9px] font-medium whitespace-nowrap " + (i === 0 ? "text-primary" : "text-[#9CA3AF]")}>{s}</span>
              {i < stages.length - 1 && <div className={"h-px flex-1 " + (i === 0 ? "bg-primary" : "bg-[#E5E7EB]")} />}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-[#6B7280]">
        You'll receive SMS and email updates at each stage.
        Return to this page to see your payment notification.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link to="/prescriptions" className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
          View My Prescriptions
        </Link>
        <button onClick={() => window.location.reload()} className="rounded-md border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-[#F0F9F4]">
          Upload Another Script
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={"rounded-md border px-4 py-3 text-sm font-semibold transition " + (active ? "border-primary bg-[#F0F9F4] text-primary" : "border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]")}>
      {children}
    </button>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#374151]">{label}</span>
      <input {...rest} className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </label>
  );
}

function SelectField({ label, options, ...rest }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#374151]">{label}</span>
      <select {...rest} className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function DeliveryOption({ active, onClick, icon: Icon, title, subtitle, badge }: { active: boolean; onClick: () => void; icon: typeof Truck; title: string; subtitle: string; badge?: string }) {
  return (
    <button type="button" onClick={onClick} className={"flex items-start gap-3 rounded-lg border p-4 text-left transition " + (active ? "border-primary bg-[#F0F9F4]" : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]")}>
      <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " + (active ? "bg-primary text-white" : "bg-[#F0F9F4] text-primary")}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-[#111827]">{title}</span>
        <span className="block text-xs text-[#6B7280] mt-0.5">{subtitle}</span>
        {badge && <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: "#0EA5E9" }}>{badge}</span>}
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">{title}</div>
      {children}
    </div>
  );
}

function DL({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-1 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <dt className="shrink-0 text-[#6B7280]">{k}:</dt>
          <dd className="font-medium text-[#111827] break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecentScripts({ list }: { list: { id: string; status: string; fileName: string; uploadedAt: string }[] }) {
  const statusColor = (status: string) => {
    if (status === "Approved — Awaiting Payment") return "bg-amber-50 text-amber-700";
    if (status === "Paid") return "bg-blue-50 text-blue-700";
    if (status === "Dispensed" || status === "Delivered") return "bg-[#F0F9F4] text-primary";
    if (status === "Rejected") return "bg-red-50 text-red-700";
    return "bg-[#F0F9F4] text-primary";
  };
  return (
    <div className="mt-8 rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="text-base font-bold text-[#111827]">My Prescriptions</h2>
      </div>
      <ul className="divide-y divide-[#E5E7EB]">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-5 py-3">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#111827]">{p.id}</div>
              <div className="truncate text-xs text-[#6B7280]">{p.fileName} · {p.uploadedAt}</div>
            </div>
            <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " + statusColor(p.status)}>
              {p.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
