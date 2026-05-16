#!/usr/bin/env node
// Confluence digest publisher.
// Usage:
//   node scripts/confluence-digest.js --sprint Sprint-12 [--dry-run]
// Inputs (export from the browser):
//   jarvis-export/logs.json       (JSON array of InvocationLog)
//   jarvis-export/pis-state.json  (optional — PisState object)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EXPORT_DIR = resolve(ROOT, 'jarvis-export');

// --- arg parsing ------------------------------------------------------------
const args = process.argv.slice(2);
const opts = { sprint: 'Sprint-12', dryRun: false };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--sprint') opts.sprint = args[++i];
  else if (args[i] === '--dry-run') opts.dryRun = true;
}

// --- .env loader (no deps) --------------------------------------------------
const env = { ...process.env };
const envPath = resolve(ROOT, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

// --- load logs --------------------------------------------------------------
if (!existsSync(EXPORT_DIR)) mkdirSync(EXPORT_DIR, { recursive: true });
const logsPath = resolve(EXPORT_DIR, 'logs.json');
const pisPath = resolve(EXPORT_DIR, 'pis-state.json');

let logs = [];
if (existsSync(logsPath)) logs = JSON.parse(readFileSync(logsPath, 'utf8'));
else console.warn(`! No logs at ${logsPath} — digest will be empty.`);

let pis = null;
if (existsSync(pisPath)) pis = JSON.parse(readFileSync(pisPath, 'utf8'));

const sprintLogs = logs.filter(l => l.sprint === opts.sprint);

// --- build digest -----------------------------------------------------------
const timeSavedMin = sprintLogs.reduce((s, l) => s + (l.timeSavedMin || 0), 0);
const prevented = sprintLogs.reduce((s, l) => s + (l.actioned || 0), 0);
const findings = sprintLogs.reduce((s, l) => s + (l.findingCount || 0), 0);
const actionRate = findings ? Math.round((prevented / findings) * 100) : 0;

const byAgent = {};
for (const l of sprintLogs) byAgent[l.agentName] = (byAgent[l.agentName] || 0) + 1;
const topAgents = Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 5);

const md = [];
md.push(`# Jarvis Digest — ${opts.sprint}`);
md.push('');
md.push(`_Generated ${new Date().toISOString()}_`);
md.push('');
md.push('## Sprint metrics');
md.push(`- Invocations: **${sprintLogs.length}**`);
md.push(`- Time saved: **${(timeSavedMin / 60).toFixed(1)} h**`);
md.push(`- Issues prevented: **${prevented}**`);
md.push(`- Action rate: **${actionRate}%**`);
md.push('');
md.push('## Top agents');
if (topAgents.length === 0) md.push('_No invocations recorded._');
for (const [name, count] of topAgents) md.push(`- ${name} — ${count}`);
md.push('');
if (pis) {
  md.push('## PIS state');
  md.push(`- Project: ${pis.projectName} ${pis.version}`);
  md.push(`- Progress to v1.0: ${pis.progressToV1}%`);
  md.push(`- Sessions logged: ${pis.sessionsLogged}`);
  for (const a of pis.areas || []) md.push(`  - ${a.name}: ${a.maturity}%`);
}

const digest = md.join('\n');
const outPath = resolve(EXPORT_DIR, `digest-${opts.sprint}.md`);
writeFileSync(outPath, digest, 'utf8');
console.log(`✓ Wrote ${outPath}`);

if (opts.dryRun) {
  console.log('\n--- DRY RUN — digest preview ---\n');
  console.log(digest);
  process.exit(0);
}

// --- Confluence publish ----------------------------------------------------
const required = ['CONFLUENCE_BASE_URL', 'CONFLUENCE_EMAIL', 'CONFLUENCE_API_TOKEN', 'CONFLUENCE_SPACE_KEY'];
const missing = required.filter(k => !env[k]);
if (missing.length) {
  console.warn(`\n! Skipping Confluence publish — missing: ${missing.join(', ')}`);
  console.warn('  Set them in .env or re-run with --dry-run.');
  process.exit(0);
}

const auth = Buffer.from(`${env.CONFLUENCE_EMAIL}:${env.CONFLUENCE_API_TOKEN}`).toString('base64');
const base = env.CONFLUENCE_BASE_URL.replace(/\/$/, '');
const title = `Jarvis Digest — ${opts.sprint}`;

function mdToStorage(text) {
  const html = text
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^\s*- (.*)$/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>');
  return `<p>${html}</p>`.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
}

const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const searchUrl = `${base}/rest/api/content?title=${encodeURIComponent(title)}&spaceKey=${env.CONFLUENCE_SPACE_KEY}&expand=version`;
const found = await fetch(searchUrl, { headers }).then(r => r.json()).catch(() => null);

const existing = found?.results?.[0];
const body = {
  type: 'page',
  title,
  space: { key: env.CONFLUENCE_SPACE_KEY },
  body: { storage: { value: mdToStorage(digest), representation: 'storage' } }
};
if (env.CONFLUENCE_PARENT_PAGE_ID) body.ancestors = [{ id: env.CONFLUENCE_PARENT_PAGE_ID }];

let res;
if (existing) {
  body.version = { number: existing.version.number + 1 };
  res = await fetch(`${base}/rest/api/content/${existing.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
} else {
  res = await fetch(`${base}/rest/api/content`, { method: 'POST', headers, body: JSON.stringify(body) });
}

if (!res.ok) {
  console.error(`✗ Confluence publish failed: ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}
const result = await res.json();
console.log(`✓ Published: ${base}${result._links?.webui ?? ''}`);
