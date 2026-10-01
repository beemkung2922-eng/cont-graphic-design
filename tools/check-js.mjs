import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const dir = new URL("../js/", import.meta.url);
const files = (await readdir(dir)).filter((file) => file.endsWith(".js"));
let failed = false;
for (const file of files) {
  await new Promise((resolve) => {
    const child = spawn(process.execPath, ["--check", join(dir.pathname, file)], { stdio: "inherit" });
    child.on("close", (code) => { if (code) failed = true; resolve(); });
  });
}
process.exitCode = failed ? 1 : 0;
