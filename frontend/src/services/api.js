const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = { headers: {}, ...options };
  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

export const profileAPI = {
  get: () => api.get("/api/profile"),
  update: (data) => api.put("/api/profile", data),
  generate: () => api.post("/api/profile/generate"),
};

export const resumeAPI = {
  upload: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/api/resume/upload`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
  uploads: () => api.get("/api/resume/uploads"),
  download: (id) => `${API_BASE}/api/resume/uploads/${id}/download`,
};

export const personasAPI = {
  list: () => api.get("/api/personas"),
  generate: (names) => api.post("/api/personas/generate", { persona_names: names }),
  del: (id) => api.del(`/api/personas/${id}`),
};

export const applicationsAPI = {
  list: (status) => api.get(`/api/applications${status ? `?status=${status}` : ""}`),
  get: (id) => api.get(`/api/applications/${id}`),
  analyze: (jd, url) => api.post("/api/jobs/analyze", { job_description: jd, url }),
  update: (id, data) => api.put(`/api/applications/${id}`, data),
  del: (id) => api.del(`/api/applications/${id}`),
};

export const interviewAPI = {
  prepare: (appId) => api.post(`/api/interview/prepare/${appId}`),
  get: (appId) => api.get(`/api/interview/${appId}`),
  kit: (appId) => api.post("/api/interview/kit", { application_id: appId }),
};

export const careeropsAPI = {
  sync: () => api.post("/api/careerops/sync"),
  scan: (portals) => api.post("/api/careerops/scan", { portals }),
  evaluate: (data) => api.post("/api/careerops/evaluate", data),
  workspace: () => api.get("/api/careerops/workspace"),
  pdf: () => fetch(`${API_BASE}/api/careerops/pdf`, { method: "POST" }).then(r => r.blob()),
};

export const memoryAPI = {
  list: () => api.get("/api/memory"),
  byCategory: (cat) => api.get(`/api/memory/${cat}`),
  store: (data) => api.post("/api/memory", data),
  del: (id) => api.del(`/api/memory/${id}`),
  context: () => api.get("/api/memory/context/view"),
};

export const pipelineAPI = {
  list: () => api.get("/api/pipeline"),
  get: (appId) => api.get(`/api/pipeline/${appId}`),
};

export const toolsAPI = {
  list: () => api.get("/api/tools"),
  execute: (name, params) => api.post(`/api/tools/${name}/execute`, { params }),
};

export const healthAPI = {
  check: () => api.get("/api/health"),
};
