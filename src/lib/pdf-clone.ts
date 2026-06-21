/** Clone a DOM block and copy rendered canvas/img pixels (cloneNode alone loses them). */
export function cloneBlockWithGraphics(block: HTMLElement): HTMLElement {
  const clone = block.cloneNode(true) as HTMLElement;

  const srcCanvases = block.querySelectorAll("canvas");
  const dstCanvases = clone.querySelectorAll("canvas");
  srcCanvases.forEach((src, i) => {
    const dst = dstCanvases[i];
    if (!dst || src.width === 0) return;
    dst.width = src.width;
    dst.height = src.height;
    dst.getContext("2d")?.drawImage(src, 0, 0);
  });

  const srcImgs = block.querySelectorAll("img");
  const dstImgs = clone.querySelectorAll("img");
  srcImgs.forEach((src, i) => {
    const dst = dstImgs[i];
    if (!dst || !src.complete || src.naturalWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = src.naturalWidth;
    canvas.height = src.naturalHeight;
    canvas.getContext("2d")?.drawImage(src, 0, 0);
    canvas.className = dst.className;
    const style = dst.getAttribute("style");
    if (style) canvas.setAttribute("style", style);
    dst.replaceWith(canvas);
  });

  return clone;
}

export async function waitForBarcodes(root: HTMLElement, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const canvases = Array.from(root.querySelectorAll("canvas"));
    const imgs = Array.from(root.querySelectorAll("img"));
    const total = canvases.length + imgs.length;
    if (total === 0) {
      await sleep(50);
      continue;
    }
    const ready =
      canvases.every((c) => c.width > 0) &&
      imgs.every((img) => img.complete && img.naturalWidth > 0);
    if (ready) return;
    await sleep(100);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function downloadBlob(blob: Blob, fileName: string) {
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const showSaveFilePicker = (
        window as unknown as {
          showSaveFilePicker: (options: {
            suggestedName?: string;
            types?: {
              description?: string;
              accept: Record<string, string[]>;
            }[];
          }) => Promise<{
            createWritable: () => Promise<{
              write: (data: Blob) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }>;
        }
      ).showSaveFilePicker;
      const handle = await showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "PDF",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }

  const file = new File([blob], fileName, { type: "application/pdf" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
