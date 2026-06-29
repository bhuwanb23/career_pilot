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

export async function listApplications(params = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status];
    statuses.forEach((s) => qs.append("status", s));
  }
  if (params.company) qs.set("company", params.company);
  if (params.minScore != null) qs.set("min_score", params.minScore);
  if (params.maxScore != null) qs.set("max_score", params.maxScore);
  if (params.sort) qs.set("sort", params.sort);
  const query = qs.toString();
  return request(`/api/applications${query ? `?${query}` : ""}`);
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

export async function getApplicationTimeline(id) {
  return request(`/api/applications/${id}/timeline`);
}

export async function addApplicationActivity(id, body) {
  return request(`/api/applications/${id}/activities`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAnalytics() {
  return request("/api/analytics");
}

export async function getAnalyticsSummary() {
  return request("/api/analytics/summary");
}

export async function syncApplicationCareerOps(id) {
  return request(`/api/applications/${id}/sync-careerops`, { method: "POST" });
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

export async function getInterviewDashboard() {
  return request("/api/interview/dashboard");
}

export async function prepareInterview(appId, { regenerate = false } = {}) {
  const qs = regenerate ? "?regenerate=true" : "";
  return request(`/api/interview/prepare/${appId}${qs}`, { method: "POST" });
}

export async function updateInterviewNotes(appId, notes) {
  return request(`/api/interview/${appId}`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

export async function getInterviewPrep(appId) {
  try {
    return await request(`/api/interview/${appId}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function getOutreachDashboard() {
  return request("/api/outreach/dashboard");
}

export async function getOutreachDue() {
  return request("/api/outreach/due");
}

export async function getOutreachSequence(appId) {
  return request(`/api/outreach/${appId}`);
}

export async function generateOutreachMessage(appId, { stepType, channel, stepId } = {}) {
  return request(`/api/outreach/${appId}/generate`, {
    method: "POST",
    body: JSON.stringify({
      step_type: stepType || "follow_up",
      channel: channel || "linkedin",
      step_id: stepId || null,
    }),
  });
}

export async function markOutreachSent(appId, stepId) {
  return request(`/api/outreach/${appId}/mark-sent`, {
    method: "POST",
    body: JSON.stringify({ step_id: stepId }),
  });
}

export async function updateOutreachSequence(appId, steps) {
  return request(`/api/outreach/${appId}/sequence`, {
    method: "PUT",
    body: JSON.stringify({ steps }),
  });
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
