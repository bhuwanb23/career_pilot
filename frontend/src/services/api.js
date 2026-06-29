const API_BASE = import.meta.env.VITE_API_URL || "";

function wsBase() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/^http/, "ws");
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body.message || detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status, detail);
  }

  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

export async function checkHealth() {
  return request("/api/health");
}

export async function getProfile() {
  try {
    return await request("/api/profile");
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function updateProfile(data) {
  return request("/api/profile", { method: "PUT", body: JSON.stringify(data) });
}

export async function generateProfile() {
  return request("/api/profile/generate", { method: "POST" });
}

export async function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/resume/upload`, { method: "POST", body: form });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status, detail);
  }
  return res.json();
}

export async function listResumeUploads() {
  return request("/api/resume/uploads");
}

export async function listPersonas() {
  return request("/api/personas");
}

export async function generatePersonas(personaNames) {
  return request("/api/personas/generate", {
    method: "POST",
    body: JSON.stringify({ persona_names: personaNames }),
  });
}

export async function parseJob(jobDescription, url = "") {
  return request("/api/jobs/parse", {
    method: "POST",
    body: JSON.stringify({ job_description: jobDescription, url }),
  });
}

export async function matchJob(jobDescription) {
  return request("/api/jobs/match", {
    method: "POST",
    body: JSON.stringify({ job_description: jobDescription }),
  });
}

export async function analyzeJob(jobDescription, url = "") {
  return request("/api/jobs/analyze", {
    method: "POST",
    body: JSON.stringify({ job_description: jobDescription, url }),
  });
}

export async function listApplications(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/api/applications${qs}`);
}

export async function getApplication(id) {
  return request(`/api/applications/${id}`);
}

export async function updateApplication(id, data) {
  return request(`/api/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteApplication(id) {
  return request(`/api/applications/${id}`, { method: "DELETE" });
}

export async function generateRecruiterMessage(applicationId, channel = "linkedin") {
  return request(`/api/applications/${applicationId}/recruiter-message`, {
    method: "POST",
    body: JSON.stringify({ channel }),
  });
}

export async function getApplicationScore(applicationId) {
  return request(`/api/applications/${applicationId}/score`);
}

export async function generateCoverLetter(applicationId, tone = "professional") {
  return request("/api/cover-letter", {
    method: "POST",
    body: JSON.stringify({ application_id: applicationId, tone }),
  });
}

export async function generateResumePdf(jobDescription = "") {
  const res = await fetch(`${API_BASE}/api/resume/generate?job_description=${encodeURIComponent(jobDescription)}`, {
    method: "POST",
  });
  if (!res.ok) throw new ApiError("Resume generation failed", res.status);
  return res.blob();
}

export async function prepareInterview(appId) {
  return request(`/api/interview/prepare/${appId}`, { method: "POST" });
}

export async function getInterviewPrep(appId) {
  try {
    return await request(`/api/interview/${appId}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function sendChatMessage(content, sessionId) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ content, session_id: sessionId }),
  });
}

export async function getChatHistory(sessionId) {
  const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  return request(`/api/chat/history${qs}`);
}

export { ApiError, API_BASE, wsBase };
