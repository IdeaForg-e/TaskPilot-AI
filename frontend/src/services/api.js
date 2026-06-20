import axios from 'axios';

const API = axios.create({ baseURL: '/api/v1' });

export const runPipeline = () => API.post('/orchestrate/run');
export const getPipelineStatus = (id) => API.get(`/orchestrate/status/${id}`);
export const ingestData = (sources) => API.post('/ingest', { sources });
export const extractTasks = () =>
  API.post('/extract', { include_hidden: true, min_confidence: 0.5 });
export const fuseTasks = () => API.post('/fuse');
export const evaluateQuality = () => API.post('/quality/evaluate');
export const getQualityReports = () => API.get('/quality/reports');
export const prioritizeTasks = () => API.post('/prioritize');
export const getRankedTasks = () => API.get('/tasks/ranked');
export const generatePlan = (data) => API.post('/daily-plan', data);
export const getPlan = (date) => API.get(`/daily-plan/${date}`);
export const getTasks = () => API.get('/tasks');
export const getTaskDetail = (id) => API.get(`/tasks/${id}`);
export const sendChatMessage = (message, context) =>
  API.post('/chat', { message, context });

export default API;
