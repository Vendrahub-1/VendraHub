import { readFileSync, writeFileSync } from "node:fs";

const configPath = "cloudflare.config.ts";
const workerName = process.env.CF_WORKER_NAME;

if (!workerName || !["vendrahub", "vendrahub-customer"].includes(workerName)) {
  throw new Error("CF_WORKER_NAME must identify the intended VendraHub Worker.");
}

let config = readFileSync(configPath, "utf8");

function ensureOnce(source, pattern, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!pattern.test(source)) {
    throw new Error(`Unexpected vinext config: missing ${label}; refusing to deploy with incomplete bindings.`);
  }
  return source.replace(pattern, (match) => `${match}\n    ${replacement}`);
}

config = ensureOnce(
  config,
  /ASSETS:\s*bindings\.assets\(\),?/,
  'IMAGES: bindings.images(),',
  "ASSETS binding",
);

if (!config.includes("WORKER_SELF_REFERENCE:")) {
  config = config.replace(
    /IMAGES:\s*bindings\.images\(\),?/,
    (match) => `${match}\n      WORKER_SELF_REFERENCE: bindings.worker({ worker: "vendrahub" }),`,
  );
  if (!config.includes("WORKER_SELF_REFERENCE:")) {
    throw new Error("Unexpected vinext config: unable to add the VendraHub service binding.");
  }
}

const compatibilityDate = /compatibilityDate\s*:\s*["'][^"']+["']\s*,?/;
if (!compatibilityDate.test(config)) {
  throw new Error("Unexpected vinext config: missing compatibility date; refusing to deploy with incomplete bindings.");
}

const additions = [
  !config.includes("compatibilityFlags:") ? 'compatibilityFlags: ["global_fetch_strictly_public"],' : null,
  !config.includes("observability:") ? 'observability: { enabled: true, headSamplingRate: 1, redactQueryString: false, logs: { enabled: true, headSamplingRate: 1, invocationLogs: true, persist: true }, traces: { enabled: true, headSamplingRate: 1, persist: true }, issues: { enabled: false } },' : null,
  workerName === "vendrahub" && !config.includes("placement:") ? 'placement: { mode: "smart" },' : null,
].filter(Boolean);

if (additions.length) {
  config = config.replace(compatibilityDate, (match) => `${match}\n    ${additions.join("\n    ")}`);
}

writeFileSync(configPath, config);
console.log(`Prepared Cloudflare config for ${workerName}, preserving Images, service binding, compatibility, and observability settings.`);
