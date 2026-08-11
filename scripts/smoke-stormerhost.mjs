import { spawn } from "node:child_process";

const port = 3217;
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["app.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk;
});
child.stderr.on("data", (chunk) => {
  output += chunk;
});

async function request(pathname) {
  const response = await fetch(`${origin}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}`);
  }
  return response;
}

try {
  let home;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      home = await request("/");
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (!home) {
    throw new Error(`Application did not start.\n${output}`);
  }

  const html = await home.text();
  const cssPath = html.match(/href="([^"]+\.css[^"]*)"/)?.[1];
  if (!cssPath) {
    throw new Error("Rendered home page does not reference a CSS asset.");
  }

  await request("/about");
  await request(cssPath);
  console.log(`StormerHost smoke test passed on Node ${process.version}.`);
  console.log(`Verified /, /about, and ${cssPath}.`);
} finally {
  child.kill("SIGTERM");
}
