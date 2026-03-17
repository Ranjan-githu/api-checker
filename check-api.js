#!/usr/bin/env node

// A small script that randomly selects a public API endpoint, queries it, and prints the result.
// This can be extended with additional endpoints, auth headers, or more complex response validation.

import { readFileSync } from "fs";

const apis = JSON.parse(readFileSync(new URL("./apis.json", import.meta.url), "utf8"));

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function checkApi() {
  const api = randomItem(apis);
  console.log(`\nChecking: ${api.name} (${api.url})`);
  console.log(`Info: ${api.info}\n`);

  try {
    const res = await fetch(api.url, {
      headers: {
        "User-Agent": "api-checker/0.1"
      }
    });

    console.log(`Status: ${res.status} ${res.statusText}`);

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) {
      const json = await res.json();
      console.log("Response (truncated):", JSON.stringify(json, null, 2).slice(0, 1024));
      if (JSON.stringify(json).length > 1024) {
        console.log("... (truncated)");
      }
    } else {
      const text = await res.text();
      console.log("Response (truncated):", text.slice(0, 1024));
      if (text.length > 1024) console.log("... (truncated)");
    }
  } catch (err) {
    console.error("Request failed:", err);
    process.exitCode = 1;
  }
}

checkApi();
