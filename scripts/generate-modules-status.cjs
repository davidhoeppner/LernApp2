// @ts-nocheck
/* eslint-env node */
/**
 * Generates (or refreshes) modules.md with an overview of all module integration status.
 * Safe read-only (does NOT modify module files). Used by apply-microquizzes.cjs after each module update
 * so progress is always persisted.
 */
const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(
  process.cwd(),
  '..',
  'src',
  'data',
  'ihk',
  'modules'
);
const OUTPUT_FILE = path.join(process.cwd(), '..', 'modules.md');

function slugify(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function analyzeModule(modPath) {
  const raw = fs.readFileSync(modPath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return { file: modPath, error: 'Invalid JSON: ' + e.message };
  }
  const id = json.id || path.basename(modPath, '.json');
  const title = json.title || '(No Title)';
  const content = json.content || '';
  const lines = content.split(/\n/);
  const h2s = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)/);
    if (m) {
      h2s.push({ title: m[1].trim(), index: i });
    }
  }
  const markers = [
    ...content.matchAll(/<!--\s*micro-quiz:([^>]+?)\s*-->/g),
  ].map(m => m[1].trim());
  const malformedMarkers = markers.filter(m => m === '[object Object]');

  const missingSections = [];
  const sectionStatus = [];
  h2s.forEach(sec => {
    const slug = slugify(sec.title);
    const expectedId = `${id}-${slug}-micro-1`;
    const has = markers.includes(expectedId);
    if (!has) missingSections.push(sec.title);
    sectionStatus.push({ section: sec.title, expectedId, has });
  });

  const complete =
    missingSections.length === 0 &&
    malformedMarkers.length === 0 &&
    h2s.length > 0;
  return {
    file: modPath,
    moduleId: id,
    title,
    sections: h2s.length,
    markers: markers.length,
    malformed: malformedMarkers.length,
    missing: missingSections.length,
    status: complete ? 'Complete' : 'Pending',
    sectionStatus,
  };
}

function generate() {
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.json'));
  const rows = files.map(f => analyzeModule(path.join(MODULES_DIR, f)));

  const header = `# Module Micro-Quiz Integration Status\n\n_Last update: ${new Date().toISOString()}_\n\n`;
  const legend = `Legend: Complete = All H2 sections have a correctly named micro-quiz marker and no malformed markers remain. Pending = Needs integration or cleanup.\n\n`;
  const tableHeader = `| Module ID | Title | H2 Sections | Markers | Malformed | Missing | Status |\n|-----------|-------|-------------|---------|-----------|---------|--------|`;
  const tableBody = rows
    .map(r => {
      if (r.error) {
        return `| ${path.basename(r.file)} | ERROR: ${r.error.replace(/\|/g, ' ')} | - | - | - | - | Error |`;
      }
      return `| ${r.moduleId} | ${r.title.replace(/\|/g, ' ')} | ${r.sections} | ${r.markers} | ${r.malformed} | ${r.missing} | ${r.status} |`;
    })
    .join('\n');

  const details =
    `\n\n## Details Per Module\n\n` +
    rows
      .map(r => {
        if (r.error) return `### ${r.file}\nError: ${r.error}\n`;
        return (
          `### ${r.moduleId} (${r.title})\nSections (${r.sections}):\n` +
          r.sectionStatus
            .map(
              s => `- ${s.section} => ${s.has ? '✅' : '❌'} (${s.expectedId})`
            )
            .join('\n') +
          '\n'
        );
      })
      .join('\n');

  fs.writeFileSync(
    OUTPUT_FILE,
    header + legend + tableHeader + '\n' + tableBody + details + '\n'
  );
  return rows;
}

if (require.main === module) {
  generate();
  console.log('modules.md generated.');
}

module.exports = { generateStatus: generate };
