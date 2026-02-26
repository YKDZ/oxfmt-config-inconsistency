// The CLI and the VSCode extension behave DIFFERENTLY for this file.
// CLI (run from sub2/): uses sub2/.oxfmtrc.json (printWidth: 120) → this 119-char line is within limit, no break needed.
// VSCode extension: uses the workspace-root .oxfmtrc.json (printWidth: 80) → wraps this line.
// After the extension formats the file, running `pnpm oxfmt --check src/index.ts` from sub2/ will
// report a formatting error because the line should NOT have been broken.
const rootConfigTestVariableNameThatIsQuiteLong =
  "Length of this line is 119.........................................";
