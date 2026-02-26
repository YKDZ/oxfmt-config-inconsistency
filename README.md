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
├── sub1/                      ← control: no local config
│   └── src/
│       └── index.ts           # long line, already broken by printWidth: 80
└── sub2/                      ← failing case: has its own config
    ├── .oxfmtrc.json          # printWidth: 120
    └── src/
        └── index.ts           # 119-char line: fits in 120, exceeds 80
```

## Steps to Reproduce

1. Clone the reproduction repository and install dependencies:
   ```sh
   git clone https://github.com/YKDZ/oxfmt-config-inconsistency
   cd oxfmt-config-inconsistency
   pnpm install
   ```

2. Open the workspace root folder in VSCode with the `oxc.oxc-vscode` extension enabled.

### Control group — `sub1` (no local `.oxfmtrc.json`)

3. Open `sub1/src/index.ts`. It contains a long line that wraps under `printWidth: 80`.
   Both the extension and the CLI fall back to the root config (`printWidth: 80`) and
   produce **identical output** — no conflict.

   Verify from `sub1/`:
   ```sh
   cd sub1 && pnpm oxfmt --check src/index.ts
   ```
   CLI passes.

### Failing case — `sub2` (has local `.oxfmtrc.json` with `printWidth: 120`)

4. Open `sub2/src/index.ts`. It contains this 119-character line:
   ```ts
   const rootConfigTestVariableNameThatIsQuiteLong = "Length of this line is 119.........................................";
   ```
   The VSCode extension applies the **root** `.oxfmtrc.json` (`printWidth: 80`) and
   **breaks the line**.

5. Verify what the CLI considers correct from `sub2/`:
   ```sh
   cd sub2 && pnpm oxfmt --check src/index.ts
   ```
   The CLI picks up `sub2/.oxfmtrc.json` (`printWidth: 120`) and reports the file as
   **already correctly formatted** — contradicting what the extension just wrote.

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
