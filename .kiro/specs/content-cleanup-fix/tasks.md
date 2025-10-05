# Implementation Plan: Content Cleanup and Fix

- [x] 1. Create backup and analysis infrastructure
  - Create backup directory structure with timestamp
  - Implement backup function for module files
  - Create analysis report template
  - _Requirements: 1.5, 5.1_

- [x] 2. Implement UTF-8 encoding fixer

- [x] 2.1 Create encoding fix script
  - Define encoding mappings for German characters (ü, ö, ä, ß, Ü, Ö, Ä)
  - Implement regex-based replacement function
  - Add JSON validation after fixes
  - Include file backup before modification
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2.2 Scan all modules for encoding issues
  - Read all JSON files from `src/data/ihk/modules/`
  - Identify files with "Ã" character sequences
  - Generate list of affected files with issue counts
  - _Requirements: 1.1, 1.4_

- [x] 2.3 Apply encoding fixes to all modules
  - Process each affected module file
  - Apply encoding corrections
  - Validate JSON structure after each fix
  - Save with UTF-8 encoding
  - Generate fix report with before/after examples
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 3. Implement content format validator

- [x] 3.1 Create JSON structure validator
  - Check for valid JSON syntax
  - Verify required fields exist (id, title, description, category, content)
  - Validate field types match expected schema
  - Check for literal "undefined" string values
  - _Requirements: 2.1, 2.4, 3.3, 5.1, 5.2_

- [x] 3.2 Create markdown content validator
  - Parse markdown in content field
  - Check for malformed headers, lists, code blocks
  - Verify escaped newlines are properly formatted
  - Validate code examples have required fields
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 3.3 Run validation on all modules
  - Execute validators on all module files
  - Generate validation report with pass/fail status
  - List all issues found with file paths and details
  - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [x] 4. Implement route auditor

- [x] 4.1 Extract and catalog all routes
  - Parse Router.js to get registered routes
  - Scan all component files for route references (navigate calls)
  - Extract module IDs from all module files
  - Extract quiz IDs from all quiz files
  - Create route registry data structure
  - _Requirements: 3.1, 5.4_

- [x] 4.2 Identify dead routes and invalid references
  - Compare referenced routes against registered routes
  - Find module prerequisites that reference non-existent modules
  - Find relatedQuizzes that reference non-existent quizzes
  - Generate list of dead routes and invalid references
  - _Requirements: 3.1, 3.2, 3.3, 5.4_

- [x] 4.3 Fix dead routes and invalid references
  - Remove or update invalid route references in components
  - Fix invalid module prerequisites
  - Fix invalid quiz references
  - Update any hardcoded route strings
  - Generate fix report
  - _Requirements: 3.2, 3.4, 3.5_

- [x] 5. Implement file cleanup manager

- [x] 5.1 Create file categorization system
  - Define KEEP list (essential docs)
  - Define REMOVE list (temporary/redundant docs)
  - Implement file scanner for workspace
  - Categorize each file as KEEP or REMOVE
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 5.2 Generate file cleanup plan
  - List all files to be removed with reasons
  - Calculate total files and disk space to be freed
  - Create cleanup plan document
  - _Requirements: 4.8_

- [x] 5.3 Execute file cleanup
  - Remove files according to plan
  - Create CLEANUP_SUMMARY.md with list of removed files
  - Verify no broken file references in remaining docs
  - _Requirements: 4.8, 4.9_

- [x] 6. Implement comprehensive validation

- [x] 6.1 Create validation orchestrator
  - Run all validators (JSON, encoding, content, references, routes)
  - Collect results from each validator
  - Generate comprehensive validation report
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.2 Generate final validation report
  - Create JSON report with all validation results
  - Include summary statistics (files processed, issues fixed, etc.)
  - Include detailed breakdown by category
  - List any remaining issues that need manual review
  - _Requirements: 5.5, 5.6_

- [x] 7. Manual testing and verification
  - Start development server and load application

  - Navigate to fue-04-security module and verify German characters display correctly
  - Test navigation to all module categories (FÜ-01, BP-01, etc.)
  - Verify all internal links work (prerequisites, related quizzes)
  - Check browser console for errors
  - Verify workspace is clean and organized
  - _Requirements: 1.4, 3.5, 4.9_
