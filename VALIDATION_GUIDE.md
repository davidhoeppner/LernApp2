# Validation Guide

This guide explains how to use the comprehensive validation system for the IHK Learning Application.

## Overview

The validation system ensures that all content (modules, quizzes, learning paths) meets quality standards before deployment. It checks for:

- **JSON Structure**: Valid JSON syntax and required fields
- **Encoding**: Proper UTF-8 encoding for German characters (ü, ö, ä, ß, etc.)
- **Markdown Content**: Well-formed markdown syntax
- **Code Examples**: Required fields in code examples
- **References**: Valid module prerequisites and quiz references
- **Routes**: No dead routes or broken navigation links

## Quick Start

### Run All Validations

```bash
npm run validate
```

This runs the comprehensive validation orchestrator that executes all validators and generates a detailed report.

### Generate Final Report

```bash
npm run validate:final
```

This generates a final validation report with:

- Executive summary
- File statistics
- Validation results
- Issue breakdown
- Fixes applied
- Recommendations

## Individual Validators

You can run specific validators independently:

### JSON Structure Validation

```bash
npm run validate:json
```

Checks:

- Valid JSON syntax
- Required fields present
- Correct field types
- No literal "undefined" values

### Markdown Content Validation

```bash
npm run validate:markdown
```

Checks:

- Well-formed headers
- Proper list formatting
- Closed code blocks
- Proper escaping

### UTF-8 Encoding Validation

```bash
npm run validate:encoding
```

Checks for encoding issues with German characters:

- ü, ö, ä, ß (lowercase umlauts and eszett)
- Ü, Ö, Ä (uppercase umlauts)

### Route Validation

```bash
npm run validate:routes
```

Checks:

- All referenced routes are registered
- Module prerequisites point to existing modules
- Quiz references point to existing quizzes

### All Modules Validation

```bash
npm run validate:all
```

Runs all validators on all module files and generates a comprehensive report.

## Understanding Validation Reports

### Console Output

The validation scripts provide color-coded console output:

- ✅ Green: Success, no issues
- ⚠️ Yellow: Warnings (non-critical issues)
- ❌ Red: Errors (critical issues that must be fixed)

### JSON Reports

Detailed JSON reports are saved to the project root:

- `COMPREHENSIVE_VALIDATION_REPORT.json` - Complete validation results
- `FINAL_VALIDATION_REPORT.json` - Executive summary with recommendations
- `JSON_STRUCTURE_VALIDATION_REPORT.json` - JSON structure issues
- `MARKDOWN_CONTENT_VALIDATION_REPORT.json` - Markdown formatting issues
- `UTF8_ENCODING_REPORT.json` - Encoding issues
- `ROUTE_AUDIT_REPORT.json` - Route and reference issues

### Report Structure

Each report contains:

```json
{
  "timestamp": "2025-10-05T20:48:42.823Z",
  "summary": {
    "totalFiles": 31,
    "validFiles": 31,
    "filesWithErrors": 0,
    "filesWithWarnings": 30,
    "totalIssues": 1533
  },
  "files": [
    {
      "file": "module-name.json",
      "valid": true,
      "issues": [],
      "errorCount": 0,
      "warningCount": 0
    }
  ]
}
```

## Issue Severity Levels

### Errors (Critical)

Must be fixed before deployment:

- Invalid JSON syntax
- Missing required fields
- Encoding issues (garbled German characters)
- Invalid references (broken links)
- Unclosed code blocks

### Warnings (Non-Critical)

Should be fixed for better quality but won't break functionality:

- Malformed markdown headers (missing space after #)
- Malformed list items (missing space after marker)
- Minor formatting issues

## Fixing Common Issues

### Encoding Issues

If you see encoding errors like "Ã¼" instead of "ü":

1. Open the file in a UTF-8 capable editor
2. Use Find & Replace to fix the encoding:
   - Ã¼ → ü
   - Ã¶ → ö
   - Ã¤ → ä
   - ÃŸ → ß
   - Ãœ → Ü
   - Ã– → Ö
   - Ã„ → Ä
3. Save the file with UTF-8 encoding
4. Run validation again to verify

Or use the automated fix script:

```bash
node scripts/fix-utf8-encoding.js
```

### Invalid References

If you see invalid module prerequisites or quiz references:

1. Check the referenced ID exists in the modules/quizzes directory
2. Update the reference to the correct ID
3. Or remove the invalid reference if it's no longer needed

### Markdown Formatting

For malformed headers or lists:

1. Add a space after # for headers: `##Header` → `## Header`
2. Add a space after list markers: `-Item` → `- Item`

## Pre-Deployment Checklist

Before deploying, ensure:

1. ✅ Run `npm run validate` - All validations pass
2. ✅ Run `npm run validate:final` - Review final report
3. ✅ Check that `Overall Status: PASSED`
4. ✅ Review any manual review items
5. ✅ Fix all critical errors (if any)
6. ✅ Consider fixing warnings for better quality

## Continuous Integration

You can add validation to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Validate Content
  run: npm run validate

- name: Generate Final Report
  run: npm run validate:final
```

The validation scripts exit with code 1 if errors are found, which will fail the CI build.

## Troubleshooting

### "Comprehensive validation report not found"

Run `npm run validate` first to generate the comprehensive report, then run `npm run validate:final`.

### "No quiz files found"

This is normal if you're only validating modules. The encoding validator checks quizzes, but it won't fail if the directory doesn't exist.

### High warning count

Warnings are non-critical formatting issues. They don't affect functionality but should be fixed for better content quality. Files with >50 warnings are flagged for manual review.

## Best Practices

1. **Run validation frequently** during development
2. **Fix errors immediately** - don't let them accumulate
3. **Review warnings periodically** - fix them in batches
4. **Check references** when adding new modules or quizzes
5. **Use UTF-8 encoding** in your editor to prevent encoding issues
6. **Validate before committing** to catch issues early

## Support

For issues or questions about the validation system:

1. Check the validation report for detailed error messages
2. Review this guide for common fixes
3. Check the design document at `.kiro/specs/content-cleanup-fix/design.md`
4. Review the requirements at `.kiro/specs/content-cleanup-fix/requirements.md`
