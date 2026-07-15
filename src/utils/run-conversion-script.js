import { convertPdfToDxf } from 'pdf-to-dxf';

(async () => {
  try {
    const scale = parseFloat(process.argv[2] || '0.02');

    // Read all bytes from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const buf = Buffer.concat(chunks);

    // Convert Node Buffer to Uint8Array as strictly required by pdf-to-dxf/pdfjs-dist
    const uint8Array = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

    const res = await convertPdfToDxf(uint8Array, { scale });
    // Write the DXF string output
    process.stdout.write(res.dxf);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
