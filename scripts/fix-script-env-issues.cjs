#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.cwd());
const files = fs.readdirSync(DIR).filter(f => /(\.cjs|\.js)$/.test(f));
let changed = 0;
for (const f of files) {
  const p = path.join(DIR, f);
  let raw = fs.readFileSync(p, 'utf8');
  let out = raw;
  // Move shebang to be first line if it's present but not at top
  const shebang = '#!/usr/bin/env node';
  if (out.includes(shebang) && !out.startsWith(shebang)) {
    // remove existing shebang
    out = out.split(shebang).join('');
    out = shebang + '\n' + out.trimStart();
  }

  // Replace occurrences of process.cwd() with process.cwd()
  if (out.includes('process.cwd()')) {
    out = out.replace(/process.cwd()/g, 'process.cwd()');
  }

  if (out !== raw) {
    fs.writeFileSync(p, out, 'utf8');
    console.log('Patched', f);
    changed++;
  }
}
console.log(`Patched ${changed} files.`);
process.exit(0);
