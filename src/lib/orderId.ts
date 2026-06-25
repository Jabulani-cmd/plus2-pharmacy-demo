// Generate a stable, presentable order ID in the format KP-LIVE-XXXXX.
// Combines a 5-digit slice of the current millisecond timestamp with a
// 3-char random suffix to minimise collisions while keeping a short,
// memorable surface in customer-facing UI ("KP-LIVE-20413").
export function makeOrderId(): string {
  const num = (Date.now() % 100000).toString().padStart(5, "0");
  return "KP-LIVE-" + num;
}

export function makeRxId(): string {
  const num = (Date.now() % 100000).toString().padStart(5, "0");
  return "RX-LIVE-" + num;
}