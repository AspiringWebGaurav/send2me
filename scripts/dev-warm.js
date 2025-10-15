/* eslint-disable no-console */
const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || `http://${HOST}:${PORT}`;

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", (err) => {
        if (Date.now() - start > timeoutMs) return reject(err);
        setTimeout(attempt, 500);
      });
    };
    attempt();
  });
}

(async () => {
  const dev = spawn("node", ["./node_modules/next/dist/bin/next", "dev"], {
    stdio: "inherit",
    env: process.env,
  });

  try {
    await waitForServer(BASE_URL);
    await waitForServer(`${BASE_URL}/verify`);
    console.log(`[warmup] ✅  /verify precompiled at ${BASE_URL}`);
  } catch (err) {
    console.warn(
      `[warmup] ⚠️  /verify warmup failed for ${BASE_URL}:`,
      err?.message || err
    );
  }

  dev.on("exit", (code) => process.exit(code ?? 1));
})();
