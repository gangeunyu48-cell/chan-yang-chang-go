import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });

  app.get("/api/download", async (req, res) => {
    const key = typeof req.query.key === "string" ? req.query.key : "";
    if (!key || !ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(400).send("Missing download file");
      return;
    }
    try {
      const forgeUrl = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
      if (!forgeResp.ok) { res.status(502).send("Storage backend error"); return; }
      const { url } = (await forgeResp.json()) as { url: string };
      const fileResp = await fetch(url);
      if (!fileResp.ok) { res.status(502).send("File download error"); return; }
      const requestedName = typeof req.query.filename === "string" ? req.query.filename : "download";
      const safeName = requestedName.replace(/[\\/\r\n"]/g, " ").trim() || "download";
      res.setHeader("Content-Type", fileResp.headers.get("content-type") || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.setHeader("Cache-Control", "no-store");
      res.send(Buffer.from(await fileResp.arrayBuffer()));
    } catch (err) {
      console.error("[StorageProxy] download failed:", err);
      res.status(502).send("Storage download error");
    }
  });
}
