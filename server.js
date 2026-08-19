const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { identities, school } = require("./src/data");
const { validateSessionInput, safeText, hasPermission } = require("./src/security");
const { processMessage, completedEscalationReply } = require("./src/aiEngine");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const sessions = new Map();
const escalationRequests = [];
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sessionFrom(body) {
  const session = sessions.get(body.sessionId);
  if (!session) {
    const error = new Error("Your secure demo session has expired. Please choose your role again.");
    error.status = 401;
    throw error;
  }
  return session;
}

function publicProfile(role) {
  const identity = identities[role];
  return {
    id: identity.id,
    name: identity.name,
    initials: identity.initials,
    detail: identity.className || identity.relationship || identity.department || identity.designation
  };
}

function createSession(body) {
  const role = safeText(body.role, 20).toLowerCase();
  const requestedId = safeText(body.identityId, 64);
  if (!validateSessionInput(role, requestedId) || !identities[role] || identities[role].id !== requestedId) {
    const error = new Error("The selected role and school identity could not be verified.");
    error.status = 403;
    throw error;
  }
  const sessionId = crypto.randomUUID();
  const session = {
    id: sessionId,
    role,
    profile: publicProfile(role),
    language: ["en", "hi", "ta", "te", "mr", "bn", "gu", "pa", "kn", "ml", "ur"].includes(body.language) ? body.language : "en",
    createdAt: Date.now(),
    pendingEscalation: null,
    history: []
  };
  sessions.set(sessionId, session);
  return { sessionId, session };
}

function createEscalation(session, target, reason) {
  const permission = target === "teacher" ? "escalation:teacher" : "escalation:management";
  if (!["teacher", "management"].includes(target) || !hasPermission(session.role, permission)) {
    const error = new Error("You do not have permission to submit that support request.");
    error.status = 403;
    throw error;
  }
  const request = {
    id: "SUP-" + String(escalationRequests.length + 1042).padStart(5, "0"),
    target,
    requestedBy: session.profile.name,
    role: session.role,
    reason: safeText(reason, 300) || "Human assistance requested.",
    status: "Submitted",
    createdAt: new Date().toISOString()
  };
  escalationRequests.push(request);
  return request;
}

async function api(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, school, service: "XYZ AI mock services" });
  }
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const body = await readBody(req);
  if (url.pathname === "/api/session") {
    const created = createSession(body);
    return sendJson(res, 201, { sessionId: created.sessionId, profile: created.session.profile, school });
  }
  const session = sessionFrom(body);
  if (url.pathname === "/api/chat" || url.pathname === "/api/voice-transcript") {
    const userMessage = safeText(body.message, 600);
    session.history.push({ role: "user", content: userMessage, at: new Date().toISOString() });
    const result = processMessage(session, userMessage);
    if (result.triggerEscalation) {
      const request = createEscalation(session, result.triggerEscalation.target, result.triggerEscalation.reason);
      result.reply = completedEscalationReply(session, request.id, request.target);
      result.data = { type: "escalation", request };
      delete result.triggerEscalation;
    }
    session.history.push({ role: "assistant", content: result.reply, at: new Date().toISOString() });
    session.history = session.history.slice(-16);
    return sendJson(res, 200, { ...result, session: { role: session.role, language: session.language } });
  }
  if (url.pathname === "/api/escalations") {
    const request = createEscalation(session, safeText(body.target, 20).toLowerCase(), body.reason);
    return sendJson(res, 201, { ok: true, request, reply: completedEscalationReply(session, request.id, request.target) });
  }
  return sendJson(res, 404, { error: "API route not found" });
}

function staticFile(req, res, url) {
  const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const candidate = path.normalize(path.join(PUBLIC_DIR, relative));
  if (!candidate.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { error: "Forbidden" });
  fs.readFile(candidate, (error, file) => {
    if (error) {
      if (error.code === "ENOENT") return sendJson(res, 404, { error: "Not found" });
      return sendJson(res, 500, { error: "Unable to load application" });
    }
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(candidate)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(file);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://" + req.headers.host);
  try {
    if (url.pathname.startsWith("/api/")) await api(req, res, url);
    else staticFile(req, res, url);
  } catch (error) {
    sendJson(res, error.status || 400, { error: error.message || "Request failed" });
  }
});

server.listen(PORT, () => {
  console.log("XYZ AI is running at http://localhost:" + PORT);
});
