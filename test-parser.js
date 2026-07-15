import DxfParser from 'dxf-parser';

try {
  const parser = new DxfParser();
  console.log("DxfParser successfully instantiated:", !!parser);
  
  // Test a DXF file WITHOUT an EOF group to verify our tolerant EOF handling!
  const dxfStringNoEof = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC"; // Missing "0\nEOF" at the end!
  
  const result = parser.parseSync(dxfStringNoEof);
  console.log("Minimal DXF (Missing EOF) parsed successfully without crashing! Result:", !!result);
  console.log("Verification status: SUCCESS");
  process.exit(0);
} catch (e) {
  console.error("Verification failed:", e);
  process.exit(1);
}
