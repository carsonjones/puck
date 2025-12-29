import React from "react";
import { render } from "ink";
import App from "./app.js";

// Clear terminal for full screen
process.stdout.write('\x1Bc');

process.stdin.setEncoding("utf8");
if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}
process.stdin.resume();

const app = render(<App />, { exitOnCtrlC: false });

app.waitUntilExit().finally(() => {
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(false);
  }
});
