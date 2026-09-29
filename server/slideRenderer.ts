import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";
import { storagePut } from "./storage";

const execFileAsync = promisify(execFile);

function naturalSort(left: string, right: string) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

/** Converts an uploaded presentation to real slide images for browser playback. */
export async function renderSlideImages(bytes: Buffer, fileName: string): Promise<string[]> {
  const workDir = await mkdtemp(join(tmpdir(), "praise-slides-"));
  const safeBase = basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const sourcePath = join(workDir, safeBase);
  const extension = extname(fileName).toLowerCase();
  const stem = basename(fileName, extname(fileName)).replace(/[^a-zA-Z0-9._-]/g, "_");
  const outputPrefix = join(workDir, "slide");

  try {
    await writeFile(sourcePath, bytes);
    let pdfPath = sourcePath;
    if (extension === ".ppt" || extension === ".pptx") {
      const profileDir = join(workDir, "libreoffice-profile");
      await execFileAsync("libreoffice", [`-env:UserInstallation=file://${profileDir}`, "--headless", "--norestore", "--nolockcheck", "--nodefault", "--convert-to", "pdf", "--outdir", workDir, sourcePath], { timeout: 180_000 });
      pdfPath = join(workDir, `${stem}.pdf`);
    }
    if (extension !== ".pdf" && extension !== ".ppt" && extension !== ".pptx") return [];

    // PNG is lossless; 220 DPI keeps Korean lyrics and music notation sharp on large church screens.
    await execFileAsync("pdftoppm", ["-png", "-r", "220", pdfPath, outputPrefix], { timeout: 180_000 });
    const renderedNames = (await readdir(workDir)).filter((name) => /^slide-\d+\.png$/i.test(name)).sort(naturalSort);
    const urls: string[] = [];
    for (const name of renderedNames) {
      const image = await readFile(join(workDir, name));
      const stored = await storagePut(`praise-library/slides/${crypto.randomUUID()}-${name}`, image, "image/png");
      urls.push(stored.url);
    }
    return urls;
  } catch (error) {
    console.warn(`[Slides] Could not render ${fileName}:`, error instanceof Error ? error.message : error);
    return [];
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
