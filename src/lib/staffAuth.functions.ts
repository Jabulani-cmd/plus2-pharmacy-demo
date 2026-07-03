import { createServerFn } from "@tanstack/react-start";

export const verifyStaffLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => {
    if (!data || typeof data.email !== "string" || typeof data.password !== "string") {
      throw new Error("Invalid credentials payload");
    }
    return { email: data.email.trim().toLowerCase(), password: data.password };
  })
  .handler(async ({ data }) => {
    const { verifyStaffPasswordServer } = await import("./staffAuth.server");
    const ok = verifyStaffPasswordServer(data.email, data.password);
    return { ok };
  });