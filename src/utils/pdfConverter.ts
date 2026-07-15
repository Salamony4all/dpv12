import { PdfToDxf } from 'pdf-to-dxf';

export async function convertPdfToDxfString(file: File, calibrationScale = 0.02): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Scale converts raw PDF points straight into physical meters (default: 1pt = 0.02m)
    const dxfString = await PdfToDxf(arrayBuffer, { scale: calibrationScale });

    if (!dxfString || dxfString.trim().length === 0) {
      throw new Error("DXF generation returned an empty dataset.");
    }

    return dxfString;
  } catch (err: unknown) {
    console.error("Isolated PDF-to-DXF conversion failed:", err);
    let errorMessage = "An unknown error occurred.";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    throw new Error(errorMessage);
  }
}