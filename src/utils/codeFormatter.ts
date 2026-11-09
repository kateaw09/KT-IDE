/**
 * Offline C/C++ & Arduino Code Formatter
 * Zero-internet rule-based code beautifier
 */

export function formatCppCode(source: string): string {
  if (!source) return '';

  const lines = source.split(/\r?\n/);
  const formatted: string[] = [];
  let indentLevel = 0;
  const indentStep = '  '; // 2 spaces standard for Arduino / Embedded C++
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Preserve empty lines
    if (!trimmed) {
      formatted.push('');
      continue;
    }

    // 1. Block comments
    if (inBlockComment) {
      formatted.push(indentStep.repeat(indentLevel) + trimmed);
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      formatted.push(indentStep.repeat(indentLevel) + trimmed);
      continue;
    }

    // 2. Preprocessor directives (#include, #define, etc.)
    if (trimmed.startsWith('#')) {
      formatted.push(trimmed);
      continue;
    }

    // 3. Single-line comments
    if (trimmed.startsWith('//')) {
      formatted.push(indentStep.repeat(indentLevel) + trimmed);
      continue;
    }

    // 4. Calculate braces for indentation
    // Strip strings and inline comments to prevent counting braces inside literals
    const stripped = trimmed
      .replace(/"(\\.|[^"\\])*"/g, '""')
      .replace(/'(\\.|[^'\\])*'/g, "''")
      .replace(/\/\/.*$/, '');

    const openCount = (stripped.match(/\{/g) || []).length;
    const closeCount = (stripped.match(/\}/g) || []).length;

    // Check if line starts with closing brace or case/default
    const startsWithClose = trimmed.startsWith('}');
    const isCase = /^(case\s+[^:]+|default)\s*:/.test(trimmed);

    let effectiveIndent = indentLevel;
    if (startsWithClose) {
      effectiveIndent = Math.max(0, indentLevel - 1);
    } else if (isCase) {
      effectiveIndent = Math.max(0, indentLevel - 1);
    }

    // 5. Clean punctuation & operators
    let cleanLine = trimmed
      // Space after commas and semicolons
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*;\s*$/g, ';')
      // Standardize comparison and logical operators
      .replace(/\s*==\s*/g, ' == ')
      .replace(/\s*!=\s*/g, ' != ')
      .replace(/\s*<=\s*/g, ' <= ')
      .replace(/\s*>=\s*/g, ' >= ')
      .replace(/\s*&&\s*/g, ' && ')
      .replace(/\s*\|\|\s*/g, ' || ');

    // Normalize assignment operators while avoiding comparison operators
    cleanLine = cleanLine.replace(/([^=!<>+\-*/%&|^])\s*=\s*([^=])/g, '$1 = $2');

    formatted.push(indentStep.repeat(effectiveIndent) + cleanLine);

    // Update indent level for following lines
    indentLevel = Math.max(0, indentLevel + openCount - closeCount);
  }

  return formatted.join('\n');
}
