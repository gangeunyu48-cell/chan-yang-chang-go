import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const caller = appRouter.createCaller({
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("songs input validation", () => {
  it("rejects an empty song title", async () => {
    await expect(caller.songs.create({
      title: "",
      category: "CCM",
      tone: "G",
      slideCount: 4,
      color: "blue",
      file: undefined,
    })).rejects.toThrow();
  });

  it("rejects categories outside hymn and CCM", async () => {
    await expect(caller.songs.create({
      title: "테스트 곡",
      category: "예배 찬양" as "CCM",
      tone: "G",
      slideCount: 4,
      color: "blue",
      file: undefined,
    })).rejects.toThrow();
  });
});
