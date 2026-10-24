const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tests = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'work'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (/\.test\.(?:js|mjs|cjs)$/.test(entry.name)) tests.push(file);
  }
}
collect(root);
const result = spawnSync(process.execPath, ['--test', ...tests.sort()], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
