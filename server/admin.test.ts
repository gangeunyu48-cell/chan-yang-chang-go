import { describe, expect, it } from "vitest";
import { isAdminPasswordValid } from "./admin";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const caller = appRouter.createCaller({
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("admin password guard", () => {
  it("accepts the configured server-side admin password", () => {
    expect(isAdminPasswordValid("Qwer3342**")).toBe(true);
  });

  it("rejects incorrect passwords", () => {
    expect(isAdminPasswordValid("wrong-password")).toBe(false);
  });

  it("verifies the supplied secret through the lightweight API", async () => {
    await expect(caller.admin.verify({ password: "Qwer3342**" })).resolves.toEqual({ valid: true });
    await expect(caller.admin.verify({ password: "wrong-password" })).resolves.toEqual({ valid: false });
  });
});
