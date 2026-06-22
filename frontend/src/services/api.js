import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://taskpilot-ai-4.onrender.com');
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${cleanUrl}/api/v1`;
};

const API = axios.create({
  baseURL: getBaseURL()
});

/**
 * Extract LLM diagnostics/warnings from any response shape.
 * Returns the first warning or null.
 */
export const extractLLMWarning = (data) => {
  return null;
};

export const getApiErrorMessage = (err) => {
  const payload = err?.response?.data;
  
  if (payload?.message) {
    if (payload.message.toLowerCase().includes('rate limit') || payload.message.toLowerCase().includes('429') || payload.message.toLowerCase().includes('too many')) {
      return null;
    }
    return payload.message;
  }
  
  if (payload?.detail) {
    const detailStr = Array.isArray(payload.detail)
      ? payload.detail.map((item) => item.msg || item.message || String(item)).join(', ')
      : String(payload.detail);
    if (detailStr.toLowerCase().includes('rate limit') || detailStr.toLowerCase().includes('429') || detailStr.toLowerCase().includes('too many')) {
      return null;
    }
    return detailStr;
  }
  
  // Network-level error classification
  if (err?.code === 'ECONNABORTED') return 'Backend request timed out. Please try again.';
  if (err?.message === 'Network Error') {
    return 'Cannot reach backend API. Please check that the backend server is running.';
  }
  if (err?.response?.status === 401) return 'API authentication failed. Check your API keys.';
  if (err?.response?.status === 404) return 'Requested resource not found on server.';
  if (err?.response?.status === 500) {
    const msg = payload?.data?.error || '';
    if (msg.toLowerCase().includes('api key')) return 'LLM API key is missing or invalid. Add GROQ_API_KEY or NVIDIA_API_KEY in backend/.env';
    if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429') || msg.toLowerCase().includes('too many')) {
      return null;
    }
    if (msg.toLowerCase().includes('timeout')) return 'LLM provider timed out. Check your network or API key validity.';
    if (msg.toLowerCase().includes('econnrefused') || msg.toLowerCase().includes('connection')) return 'Cannot connect to LLM provider. Check your network connection.';
    if (msg.toLowerCase().includes('database') || msg.toLowerCase().includes('sqlite')) return 'Database error. The database may be locked or corrupted.';
    return 'Backend server error. Check logs for details.';
  }
  
  return err?.message || 'Unexpected API error occurred.';
};

const unwrap = (promise) =>
  promise.then((res) => {
    const body = res.data;
    if (body?.success === false) {
      const errorMsg = body?.message || body?.data?.error || 'Backend request failed.';
      const error = new Error(errorMsg);
      // Attach llm_diagnostics to the error so callers can inspect them
      error.llm_diagnostics = body?.data?.llm_diagnostics || body?.llm_diagnostics || [];
      throw error;
    }
    // Attach llm_diagnostics to the resolved value when present
    const result = body?.data ?? body;
    if (body?.data?.llm_diagnostics) {
      result._llm_diagnostics = body.data.llm_diagnostics;
    }
    return result;
  });
const response = (data) => ({ data });

export const runPipeline = () =>
  unwrap(API.post('/orchestrate/run')).then((data) => {
    if (data?.status === 'failed') {
      const err = new Error(data.error || `Pipeline failed at ${data.failed_agent || 'unknown stage'}.`);
      err.llm_diagnostics = data._llm_diagnostics || data.llm_diagnostics || [];
      throw err;
    }
    return response(data);
  });
export const getPipelineStatus = (id) =>
  unwrap(API.get(`/orchestrate/status/${id}`)).then(response);
export const getLatestPipelineRun = () => unwrap(API.get('/orchestrate/latest')).then(response);
export const ingestData = (sources) => unwrap(API.post('/ingest', { sources })).then(response);
export const extractTasks = () =>
  unwrap(API.post('/extract', { include_hidden: true, min_confidence: 0.5 })).then(response);
export const fuseTasks = () => unwrap(API.post('/fuse')).then(response);
export const evaluateQuality = () => unwrap(API.post('/quality/evaluate')).then(response);
export const getQualityReports = () => unwrap(API.get('/quality/reports')).then(response);
export const prioritizeTasks = () => unwrap(API.post('/prioritize')).then(response);
export const getRankedTasks = () => unwrap(API.get('/tasks/ranked')).then(response);
export const generatePlan = (data) => unwrap(API.post('/daily-plan', data)).then(response);
export const getPlan = (date) => unwrap(API.get(`/daily-plan/${date}`)).then(response);
export const getTasks = () =>
  unwrap(API.get('/tasks')).then((data) => response(Array.isArray(data) ? data : data?.tasks || []));
export const getTaskDetail = (id) =>
  unwrap(API.get(`/tasks/${id}`)).then((data) =>
    response(data?.task ? { ...data.task, quality: data.quality, priority: data.priority, context_links: data.context_links } : data)
  );
export const getPlansList = () => unwrap(API.get('/daily-plans')).then(response);
export const updateTaskStatus = (id, status) => unwrap(API.post(`/tasks/${id}/status`, { status })).then(response);
export const sendChatMessage = (message) => unwrap(API.post('/chat', { message })).then(response);

export default API;
