import { readFileSync, writeFileSync } from "node:fs";

const configPath = "cloudflare.config.ts";
const workerName = process.env.CF_WORKER_NAME;

if (!workerName || !["vendrahub", "vendrahub-customer"].includes(workerName)) {
  throw new Error("CF_WORKER_NAME must identify the intended VendraHub Worker.");
}

let config = readFileSync(configPath, "utf8");

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) {
    throw new Error(`Unexpected vinext config: missing ${label}; refusing to deploy with incomplete bindings.`);
  }
  return source.replace(search, replacement);
}

config = replaceOnce(
  config,
  "ASSETS: bindings.assets(),",
  [
    "ASSETS: bindings.assets(),",
    "      IMAGES: bindings.images(),",
    '      WORKER_SELF_REFERENCE: bindings.worker({ worker: "vendrahub" }),',
  ].join("\n"),
  "ASSETS binding",
);

config = replaceOnce(
  config,
  'compatibilityDate: "2026-11-21",',
  [
    'compatibilityDate: "2026-11-21",',
    '    compatibilityFlags: ["global_fetch_strictly_public"],',
    "    observability: { enabled: true, headSamplingRate: 1, redactQueryString: false, logs: { enabled: true, headSamplingRate: 1, invocationLogs: true, persist: true }, traces: { enabled: true, headSamplingRate: 1, persist: true }, issues: { enabled: false } },",
    ...(workerName === "vendrahub" ? ['    placement: { mode: "smart" },'] : []),
  ].join("\n"),
  "compatibility date",
);

writeFileSync(configPath, config);
console.log(`Prepared Cloudflare config for ${workerName}, preserving Images, service binding, compatibility, and observability settings.`);
