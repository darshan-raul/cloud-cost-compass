import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { getAuthToken } from "@/auth/authProvider";
import { getSession_ } from "@/auth/session";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function buildClient(prefix: string): AxiosInstance {
  const client = axios.create({ baseURL: `${API_BASE}${prefix}` });
  client.interceptors.request.use((cfg: AxiosRequestConfig) => {
    const token = getAuthToken();
    const s = getSession_();
    cfg.headers = {
      ...(cfg.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(s?.tenantId ? { "X-Tenant-Id": s.tenantId } : {}),
    } as AxiosRequestConfig["headers"];
    return cfg;
  });
  return client;
}

export const mcpClient = buildClient("/mcp");
export const ragClient = buildClient("/rag");
export const alertsClient = buildClient("/alerts");
export const agentClient = buildClient("/agent");
