import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { createSong, deleteSong, getSongById, listSongs, updateSong } from "./db";
import { isAdminPasswordValid } from "./admin";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const categories = ["찬송가", "CCM"] as const;
const colors = ["rose", "sage", "amber", "blue", "violet", "teal"];
const songFields = z.object({
  title: z.string().trim().min(1).max(255),
  category: z.enum(categories),
  hymnNumber: z.number().int().min(1).max(999).nullable().optional(),
  slideCount: z.number().int().min(1).max(999).default(1),
  color: z.string().max(24).default("blue"),
});

const fileInput = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(120).default("application/octet-stream"),
  fileData: z.string().min(1).max(68_000_000),
  fileSize: z.number().int().nonnegative().max(50_000_000),
}).optional();

const bulkFileInput = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(120).default("application/octet-stream"),
  fileData: z.string().min(1).max(68_000_000),
  fileSize: z.number().int().nonnegative().max(50_000_000),
});

async function saveFile(file: z.infer<NonNullable<typeof fileInput>>) {
  if (!file) return {};
  const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const bytes = Buffer.from(file.fileData, "base64");
  const stored = await storagePut(`praise-library/${crypto.randomUUID()}-${safeName}`, bytes, file.mimeType);
  return { fileName: file.fileName, fileKey: stored.key, fileUrl: stored.url, mimeType: file.mimeType, fileSize: file.fileSize };
}

function assertAdminPassword(password: string) {
  if (!isAdminPasswordValid(password)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 비밀번호가 올바르지 않습니다." });
  }
}

function inferHymnNumber(fileName: string): number | null {
  const stem = fileName.replace(/\.(pptx?|pdf)$/i, "").trim();
  const match = stem.match(/(?:^|[\s_-])(?:제\s*)?(\d{1,3})(?:\s*장)?(?:$|[\s_.-])/i) ?? stem.match(/^(?:제\s*)?(\d{1,3})/i);
  const number = match ? Number(match[1]) : NaN;
  return Number.isInteger(number) && number >= 1 && number <= 999 ? number : null;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  admin: router({
    verify: publicProcedure.input(z.object({ password: z.string() })).query(({ input }) => ({ valid: isAdminPasswordValid(input.password) })),
  }),
  songs: router({
    list: publicProcedure.query(() => listSongs()),
    create: publicProcedure.input(songFields.extend({ adminPassword: z.string().min(1), file: fileInput })).mutation(async ({ input }) => {
      assertAdminPassword(input.adminPassword);
      const { file: fileInputValue, adminPassword: _adminPassword, ...songInput } = input;
      const file = await saveFile(fileInputValue);
      return createSong({ ...songInput, ...file });
    }),
    bulkCreate: publicProcedure.input(z.object({ adminPassword: z.string().min(1), category: z.enum(categories), files: z.array(bulkFileInput).min(1).max(700) })).mutation(async ({ input }) => {
      assertAdminPassword(input.adminPassword);
      const results = [];
      for (let index = 0; index < input.files.length; index += 1) {
        const file = input.files[index];
        const stored = await saveFile(file);
        const title = file.fileName.replace(/\.(pptx?|pdf)$/i, "").replace(/[_-]+/g, " ").trim();
        results.push(await createSong({ title: title || `새 곡 ${index + 1}`, category: input.category, hymnNumber: input.category === "찬송가" ? inferHymnNumber(file.fileName) : null, slideCount: 1, color: colors[index % colors.length], ...stored }));
      }
      return results;
    }),
    update: publicProcedure.input(z.object({ id: z.number().int().positive(), adminPassword: z.string().min(1), data: songFields.partial(), file: fileInput })).mutation(async ({ input }) => {
      assertAdminPassword(input.adminPassword);
      const current = await getSongById(input.id);
      if (!current) throw new Error("Song was not found");
      const file = await saveFile(input.file);
      return updateSong(input.id, { ...input.data, ...(input.file ? file : {}) });
    }),
    remove: publicProcedure.input(z.object({ id: z.number().int().positive(), adminPassword: z.string().min(1) })).mutation(async ({ input }) => {
      assertAdminPassword(input.adminPassword);
      await deleteSong(input.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
