#!/usr/bin/env node
/**
 * generate_bt_company_ids.mjs
 *
 * One-time fetch of official Bluetooth SIG company identifiers.
 * Source: bluetooth.com Assigned Numbers (Bitbucket — authoritative)
 * Output: src/btCompanyIds.ts — sovereign offline TypeScript lookup
 *
 * Run when the SIG list updates:
 *   node scripts/generate_bt_company_ids.mjs
 *
 * Pipeline: BT SIG YAML (A) → transform (B) → TS const (C)
 * Zero runtime dependency. Deterministic builds.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'src', 'btCompanyIds.ts');

const SOURCE_URL =
  'https://bitbucket.org/bluetooth-SIG/public/raw/HEAD/assigned_numbers/company_identifiers/company_identifiers.yaml';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

console.log('Fetching official BT SIG company identifiers…');
console.log(`  Source: ${SOURCE_URL}`);

const yaml = await fetch(SOURCE_URL);

// Parse YAML: value: 0xHHHH / name: '...'
const entries = [];
const rx = /value:\s*(0x[0-9A-Fa-f]+)\s*\n\s*name:\s*'([^']*)'/g;
let m;
while ((m = rx.exec(yaml)) !== null) {
  entries.push({ code: parseInt(m[1], 16), name: m[2] });
}
entries.sort((a, b) => a.code - b.code);

console.log(`  ${entries.length} companies parsed`);

const today = new Date().toISOString().slice(0, 10);
const lines = entries.map(({ code, name }) => {
  const safe = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `  ${code}: '${safe}',`;
});

const ts = `// AUTO-GENERATED — do not edit by hand.
// Source: bluetooth.com Assigned Numbers — Company Identifiers (official BT SIG)
// Regenerate: node scripts/generate_bt_company_ids.mjs
// ${entries.length} registered companies as of ${today}

const BT_COMPANY_IDS: Record<number, string> = {
${lines.join('\n')}
};

export default BT_COMPANY_IDS;
`;

fs.writeFileSync(OUT, ts, 'utf8');
console.log(`  Written → src/btCompanyIds.ts`);
console.log(`  ${entries.length} entries. Metro reload picks this up immediately.`);
