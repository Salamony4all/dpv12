import { NextResponse } from 'next/server';
import { runConversion } from '@/utils/conversion-bridge';

export async function POST(req: Request) {
  try {
    const { fileBase64, calibrationScale = 0.02 } = await req.json();

    if (!fileBase64) {
      return NextResponse.json({ success: false, error: "No file data provided" }, { status: 400 });
    }

    const buffer = Buffer.from(fileBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');

    const dxfString = await runConversion(buffer, calibrationScale);

    if (!dxfString || dxfString.trim().length === 0) {
      throw new Error("DXF generation returned an empty dataset.");
    }

    return NextResponse.json({
      success: true,
      dxfString: dxfString
    });

  } catch (err: unknown) {
    console.error("Isolated PDF-to-DXF conversion failed:", err);
    let errorMessage = "An unknown error occurred.";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}