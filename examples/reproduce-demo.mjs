import { readFile } from "node:fs/promises";
const root = process.env.GHOSTCASE_FIXTURE;
let log;
try { log = await readFile(`${root}/app.log`, "utf8"); }
catch { log = await readFile(`${root}/examples/app.log`, "utf8"); }
if (log.includes("NORMALIZATION_BUG")) console.error("NORMALIZATION_BUG");
