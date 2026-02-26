// Control group: sub1 has no local .oxfmtrc.json.
// Both the CLI and the VSCode extension fall back to the root config (printWidth: 80)
// and agree on the output — this line is correctly broken at the root printWidth.
const sub1ConfigTestVariableNameThatIsQuiteLong =
  "This is a test string that should demonstrate the printWidth configuration in root directory";
