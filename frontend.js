const logEl = document.getElementById("log");
const apiSelect = document.getElementById("apiSelect");
const urlInput = document.getElementById("urlInput");
const infoEl = document.getElementById("apiInfo");
const methodSelect = document.getElementById("methodSelect");
const headersInput = document.getElementById("headersInput");
const bodyInput = document.getElementById("bodyInput");

let apis = [];

function appendLog(message, kind = "info") {
  const line = document.createElement("div");
  line.textContent = message;
  line.className = kind;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.innerHTML = "";
}

function setApiInfo(api) {
  if (!api) {
    infoEl.textContent = "";
    return;
  }
  infoEl.textContent = api.info || "";
}

function parseHeaders(raw) {
  if (!raw.trim()) return {};
  try {
    const json = JSON.parse(raw);
    if (json && typeof json === "object" && !Array.isArray(json)) {
      return json;
    }
  } catch (e) {
    // fall through to parse simple key:value lines
  }

  const headers = {};
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split(":");
      if (parts.length < 2) return;
      const key = parts.shift().trim();
      const value = parts.join(":").trim();
      if (key) headers[key] = value;
    });
  return headers;
}

function truncate(text, max = 2000) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n... (truncated, total ${text.length} chars)`;
}

function updateUrlFromSelect() {
  const selected = apiSelect.value;
  const api = apis.find((a) => a.name === selected);
  if (api) {
    urlInput.value = api.url;
    setApiInfo(api);
  }
}

function chooseRandomApi() {
  if (!apis.length) return;
  const api = apis[Math.floor(Math.random() * apis.length)];
  apiSelect.value = api.name;
  updateUrlFromSelect();
}

async function runCheck() {
  clearLog();
  const url = urlInput.value.trim();
  if (!url) {
    appendLog("Please provide a URL to check.", "error");
    return;
  }

  const method = methodSelect.value;
  const headers = parseHeaders(headersInput.value);
  const body = bodyInput.value.trim();

  appendLog(`-> ${method} ${url}`);
  if (Object.keys(headers).length) {
    appendLog(`Headers: ${JSON.stringify(headers)}`);
  }
  if (body) {
    appendLog(`Request body: ${body.slice(0, 1024)}${body.length > 1024 ? "..." : ""}`);
  }

  let resp;
  try {
    const options = { method, headers };
    if (body && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      options.body = body;
      if (!options.headers["Content-Type"]) {
        options.headers["Content-Type"] = "application/json";
      }
    }
    resp = await fetch(url, options);
  } catch (err) {
    appendLog(`Request failed: ${err}`);
    return;
  }

  appendLog(`<- ${resp.status} ${resp.statusText}`);
  appendLog(`Response headers: ${JSON.stringify(Object.fromEntries(resp.headers.entries()))}`);

  const contentType = resp.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  try {
    if (isJson) {
      const json = await resp.json();
      appendLog("Response (JSON):");
      appendLog(truncate(JSON.stringify(json, null, 2)), "json");
    } else {
      const text = await resp.text();
      appendLog("Response (text):");
      appendLog(truncate(text), "text");
    }
  } catch (err) {
    appendLog(`Unable to parse response: ${err}`);
  }
}

async function init() {
  try {
    const res = await fetch("./apis.json");
    apis = await res.json();
  } catch (err) {
    console.warn("Could not load apis.json", err);
    apis = [];
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- select an endpoint --";
  apiSelect.appendChild(placeholder);

  apis.forEach((api) => {
    const opt = document.createElement("option");
    opt.value = api.name;
    opt.textContent = api.name;
    apiSelect.appendChild(opt);
  });

  apiSelect.addEventListener("change", updateUrlFromSelect);
  document.getElementById("runBtn").addEventListener("click", runCheck);
  document.getElementById("randomBtn").addEventListener("click", chooseRandomApi);

  // prefill with the first API if available
  if (apis.length) {
    apiSelect.value = apis[0].name;
    updateUrlFromSelect();
  }
}

init();
