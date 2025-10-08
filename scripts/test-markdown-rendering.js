#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */


/**
 * Test Markdown Rendering
 * Demonstrates the before/after of the markdown rendering fix
 */

// Sample content with escaped newlines (as stored in JSON)
const sampleContent =
  '# FÜ-04: Sicherstellen der Informationssicherheit\\n\\n## Einführung\\n\\nInformationssicherheit ist ein zentrales Thema in der IT.\\n\\n### 1.1 Vertraulichkeit\\n\\n**Definition**: Nur autorisierte Personen dürfen auf Informationen zugreifen.\\n\\n**Maßnahmen:**\\n- Verschlüsselung\\n- Zugriffskontrollen\\n- Authentifizierung';

console.log('🧪 Testing Markdown Rendering\n');
console.log('═'.repeat(80));

// BEFORE FIX - Simple replacement (broken)
console.log('\n❌ BEFORE FIX (Broken):');
console.log('─'.repeat(80));

function markdownToHtmlBroken(markdown) {
  let html = markdown;

  // Headers (won't work because newlines are escaped)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return html;
}

const brokenOutput = markdownToHtmlBroken(sampleContent);
console.log(brokenOutput);
console.log('\n⚠️  Notice: Content is still one long string with \\n visible');

// AFTER FIX - Proper handling (working)
console.log('\n\n✅ AFTER FIX (Working):');
console.log('─'.repeat(80));

function markdownToHtmlFixed(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // CRITICAL: Convert escaped newlines to actual newlines FIRST
  html = html.replace(/\\n/g, '\n');

  // Headers (now works because we have real newlines)
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Lists
  const lines = html.split('\n');
  let inList = false;
  let processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = /^- (.+)/.test(line);

    if (isListItem) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(line.replace(/^- (.+)/, '<li>$1</li>'));
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Paragraphs
  const blocks = html.split('\n\n');
  html = blocks
    .map(block => {
      block = block.trim();
      if (block.startsWith('<h') || block.startsWith('<ul') || block === '') {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n\n');

  return html;
}

const fixedOutput = markdownToHtmlFixed(sampleContent);
console.log(fixedOutput);
console.log('\n✅ Notice: Content is properly formatted with HTML tags');

// Summary
console.log('\n\n' + '═'.repeat(80));
console.log('📊 COMPARISON SUMMARY\n');

console.log('BEFORE FIX:');
console.log('  - Escaped newlines (\\n) remain in output');
console.log('  - Regex patterns like ^# never match (no line breaks)');
console.log('  - Content appears as one long string');
console.log('  - Headers, lists, paragraphs not formatted\n');

console.log('AFTER FIX:');
console.log('  - Escaped newlines converted to real line breaks');
console.log('  - Regex patterns work correctly');
console.log('  - Content properly structured with HTML tags');
console.log('  - Headers, lists, paragraphs all formatted correctly');

console.log('\n' + '═'.repeat(80));
console.log('✅ Fix Applied: src/components/IHKModuleView.js');
console.log('📝 Documentation: MARKDOWN_RENDERING_FIX.md');
console.log('═'.repeat(80));
