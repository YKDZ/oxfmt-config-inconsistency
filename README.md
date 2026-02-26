# oxfmt Config Lookup Inconsistency: CLI vs VSCode Extension

## Bug Description

The `oxfmt` CLI and the VSCode extension (`oxc.oxc-vscode`) resolve `.oxfmtrc.json`
configuration files differently in a monorepo workspace:

- **CLI**: starts config lookup from the directory where the command is run, so it
  correctly picks up the nearest sub-project config.
- **VSCode extension**: always starts config lookup from the workspace root, so it
  always picks up the root-level config and ignores any sub-project config files.

This means formatting decisions made by the extension contradict what the CLI considers
correctly formatted, making it impossible to have per-package `oxfmt` configuration in a
monorepo.

## Reproduction Repository Structure

```
oxfmt-config-inconsistency/    ← workspace root
├── .oxfmtrc.json              # printWidth: 80
├── sub1/
│   ├── .oxfmtrc.json          # printWidth: 100  (not yet created; same issue applies)
│   └── src/
│       └── index.ts
└── sub2/
    ├── .oxfmtrc.json          # printWidth: 120
    └── src/
        └── index.ts           # contains a line that is exactly 119 characters long
```

## Steps to Reproduce

1. Clone or create the above project structure with the config files described.

2. Install dependencies from the workspace root:
   ```sh
   pnpm install
   ```

3. Open the workspace root folder (`oxfmt-config-inconsistency/`) in VSCode with the
   `oxc.oxc-vscode` extension installed and enabled.

4. Open `sub2/src/index.ts`. The file contains this line (119 characters):
   ```ts
   const rootConfigTestVariableNameThatIsQuiteLong = "Length of this line is 119.........................................";
   ```
   The VSCode extension applies the **root** `.oxfmtrc.json` (`printWidth: 80`) and
   wraps/breaks this line.

5. From the `sub2/` directory, verify what the CLI considers correct:
   ```sh
   cd sub2
   pnpm oxfmt --check src/index.ts
   ```
   The CLI correctly picks up `sub2/.oxfmtrc.json` (`printWidth: 120`) and reports the
   119-character line as **already correctly formatted** (no line break needed).

## Expected Behavior

The VSCode extension should resolve `.oxfmtrc.json` by walking up the directory tree from
the file being formatted, just as the CLI does. For `sub2/src/index.ts`, it should use
`sub2/.oxfmtrc.json` (`printWidth: 120`), not the workspace-root config
(`printWidth: 80`).

## Actual Behavior

The extension uses the workspace root's `.oxfmtrc.json` (`printWidth: 80`) regardless of
where the file being formatted resides. As a result:

- The extension wraps the 119-character line in `sub2/src/index.ts`.
- Running `oxfmt --check src/index.ts` from `sub2/` then **reports the extension's
  output as incorrectly formatted**, because the line should not have been broken.

This creates a conflict where the extension and CLI disagree on what is correctly
formatted, making editor-based auto-formatting unreliable in monorepos.

## Environment

| Component        | Version     |
| ---------------- | ----------- |
| oxfmt            | 0.35.0      |
| TypeScript       | 5.9.3       |
| VSCode Extension | oxc.oxc-vscode (oxc) |

## References

- Formatter docs: https://oxc.rs/docs/guide/usage/formatter.html
