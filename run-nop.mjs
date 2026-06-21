import { spawn } from 'child_process';
import path from 'path';

// Override spawn to use cmd.exe instead of bash on Windows
const originalSpawn = spawn;
import * as cp from 'child_process';

cp.spawn = function(command, args, options) {
  if (command === 'bash' || command.endsWith('bash.exe')) {
    console.log('Intercepted bash spawn, redirecting to cmd...');
    // Bash args are usually ['-c', 'command string']
    // Cmd args are ['/c', 'command string']
    let newArgs = args;
    if (args && args.length >= 2 && (args[0] === '-c' || args[0] === '--noprofile')) {
      // Find the actual command
      const cmdIndex = args.indexOf('-c');
      if (cmdIndex !== -1 && cmdIndex + 1 < args.length) {
         newArgs = ['/c', args[cmdIndex + 1]];
      } else {
         newArgs = ['/c', 'npx vercel build'];
      }
    }
    return originalSpawn('cmd.exe', newArgs, options);
  }
  return originalSpawn(command, args, options);
};

// Now import next-on-pages CLI and run it
import('@cloudflare/next-on-pages/bin/index.js').catch(e => console.error(e));
