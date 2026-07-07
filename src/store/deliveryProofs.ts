// Local proof-of-delivery photo store (demo).
// Keyed by orderId; persisted to localStorage so the driver's
// completed list still shows the photo after a reload.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DeliveryProof = {
  orderId: string;
  photoDataUrl: string;
  capturedAt: number;
};

type State = {
  proofs: Record<string, DeliveryProof>;
  setProof: (orderId: string, photoDataUrl: string) => void;
  getProof: (orderId: string) => DeliveryProof | undefined;
};

export const useDeliveryProofs = create<State>()(
  persist(
    (set, get) => ({
      proofs: {},
      setProof: (orderId, photoDataUrl) =>
        set((s) => ({
          proofs: {
            ...s.proofs,
            [orderId]: { orderId, photoDataUrl, capturedAt: Date.now() },
          },
        })),
      getProof: (orderId) => get().proofs[orderId],
    }),
    { name: "kings-delivery-proofs" },
  ),
);

/** Read a File as a compressed JPEG data URL (max 1280px, ~0.8 quality). */
export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.8);
}
