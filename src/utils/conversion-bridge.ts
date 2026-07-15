import { spawn } from 'child_process';
import * as Path from 'path';

async function runConversion(buffer: Buffer, scale = 0.02): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = Path.join(process.cwd(), 'src', 'utils', 'run-conversion-script.js');
    const args = [scriptPath, scale.toString()];

    const child = spawn(process.execPath, args, {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    let output = '';
    let error = '';

    if (child.stdout) child.stdout.on('data', (data) => { output += data.toString(); });
    if (child.stderr) child.stderr.on('data', (data) => { error += data.toString(); });
    
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(error || 'Conversion process exited with error'));
    });

    if (child.stdin) {
      child.stdin.write(buffer);
      child.stdin.end();
    }
  });
}

export { runConversion };
