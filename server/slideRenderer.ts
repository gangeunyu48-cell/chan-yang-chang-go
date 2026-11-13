import { execFile } from "node:child_process";
import { access, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
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
      await execFileAsync("libreoffice", [`-env:UserInstallation=file://${profileDir}`, "--headless", "--norestore", "--nolockcheck", "--nodefault", "--convert-to", "pdf:impress_pdf_Export", "--outdir", workDir, sourcePath], { timeout: 180_000 });
      const expectedPdf = join(workDir, `${stem}.pdf`);
      try {
        await access(expectedPdf);
        pdfPath = expectedPdf;
      } catch {
        // LibreOffice can normalize non-ASCII names differently. Use the only
        // generated PDF instead of assuming the output filename.
        const generatedPdf = (await readdir(workDir)).find((name) => name.toLowerCase().endsWith(".pdf"));
        if (!generatedPdf) throw new Error("LibreOffice가 PDF를 만들지 못했어요.");
        pdfPath = join(workDir, generatedPdf);
      }
    }
    if (extension !== ".pdf" && extension !== ".ppt" && extension !== ".pptx") return [];

    // Use a practical church-screen resolution first so every uploaded song can
    // be prepared within the hosted server's memory/time limit. Retry even
    // lighter for unusually large or complex decks.
    try {
      await execFileAsync("pdftoppm", ["-png", "-r", "120", pdfPath, outputPrefix], { timeout: 180_000 });
    } catch {
      await execFileAsync("pdftoppm", ["-png", "-r", "72", pdfPath, outputPrefix], { timeout: 180_000 });
    }
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
