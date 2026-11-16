const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'translator.ts');
const content = fs.readFileSync(filePath, 'utf8');

const dictStart = content.indexOf('export const dictionary: Record<string, { te: string; hi: string }> = {');
const dictEnd = content.indexOf('export const wordDictionary:');

if (dictStart === -1 || dictEnd === -1) {
  console.error('Could not find dictionary boundaries');
  process.exit(1);
}

const before = content.slice(0, dictStart);
const dictText = content.slice(dictStart, dictEnd);
const after = content.slice(dictEnd);

// Regex matching entries across multiple lines or single lines
const entryRegex = /(?:'|")((?:\\'|\\"|[^'"])+)(?:'|"):\s*\{\s*te:\s*(?:'|")((?:\\'|\\"|[^'"])*)(?:'|"),\s*hi:\s*(?:'|")((?:\\'|\\"|[^'"])*)(?:'|")\s*\}/g;

const entries = new Map();
let m;
while ((m = entryRegex.exec(dictText)) !== null) {
  const key = m[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
  const te = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
  const hi = m[3].replace(/\\'/g, "'").replace(/\\"/g, '"');
  entries.set(key, { te, hi });
}

console.log('Unique entries count:', entries.size);

let newDict = 'export const dictionary: Record<string, { te: string; hi: string }> = {\n';
for (const [k, v] of entries) {
  const escapedK = k.replace(/'/g, "\\'");
  const escapedTe = v.te.replace(/'/g, "\\'");
  const escapedHi = v.hi.replace(/'/g, "\\'");
  newDict += `  '${escapedK}': { te: '${escapedTe}', hi: '${escapedHi}' },\n`;
}
newDict += '};\n\n';

const newContent = before + newDict + after;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully wrote deduplicated translator.ts!');

