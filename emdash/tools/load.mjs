// seed.json の content を、起動中のEmDashへ CLI 経由で投入する
import fs from "node:fs"; import { execFileSync } from "node:child_process";
const url = process.argv[2] || "http://localhost:4331";
const s = JSON.parse(fs.readFileSync("seed/seed.json", "utf8"));
let n = 0, ng = 0;
for (const [coll, list] of Object.entries(s.content)) for (const e of list) {
  fs.writeFileSync("/tmp/emd/one.json", JSON.stringify(e.data));
  try { execFileSync("npx", ["emdash","content","create",coll,"--file","/tmp/emd/one.json","--slug",e.slug,"--url",url,...(e.status==="draft"?["--draft"]:[])],{stdio:"pipe"}); n++; }
  catch (err) { ng++; console.error("NG", coll, e.slug, String(err.stderr||err.message).slice(0,200)); }
}
console.log({ ok: n, ng });
