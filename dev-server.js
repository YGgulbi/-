import { spawn } from 'child_process';

const args = [];
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--host') {
    i++; // skip next arg as well
  } else if (process.argv[i].startsWith('--host=')) {
    // skip
  } else {
    args.push(process.argv[i]);
  }
}

const child = spawn('npx', ['next', 'dev', '-p', '3000', '-H', '0.0.0.0', ...args], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', code => process.exit(code || 0));
