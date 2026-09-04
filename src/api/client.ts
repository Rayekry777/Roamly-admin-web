import axios, { AxiosError, type AxiosInstance } from "axios";

import type { ErrorResult, Result } from "@/types/http";
import { clearAdminToken, readAdminToken } from "@/utils/session";

let unauthorizedHandler: (() => void) | undefined;

export function setUnauthorizedHandler(handler?: () => void): void {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ErrorResult["fieldErrors"] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isResult(value: unknown): value is Result<unknown> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.code === "OK" &&
    typeof candidate.message === "string" &&
    "data" in candidate
  );
}

function isErrorResult(value: unknown): value is ErrorResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === "string" && typeof candidate.message === "string"
  );
}

export function mapHttpError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!(error instanceof AxiosError)) {
    return new ApiError(0, "CLIENT_ERROR", "请求处理失败，请稍后重试");
  }
  if (!error.response)
    return new ApiError(0, "NETWORK_ERROR", "网络连接失败，请检查服务状态");
  const status = error.response.status;
  const body = error.response.data;
  if (isErrorResult(body)) {
    return new ApiError(
      status,
      body.code,
      body.message,
      body.fieldErrors ?? [],
    );
  }
  return new ApiError(status, "RESPONSE_CONTRACT_INVALID", "服务响应格式异常");
}

export function createHttpClient(
  baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api",
): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 10_000 });
  client.interceptors.request.use((config) => {
    const token = readAdminToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    (response) => {
      if (response.status === 204) return undefined;
      if (!isResult(response.data)) {
        throw new ApiError(
          response.status,
          "RESPONSE_CONTRACT_INVALID",
          "服务响应格式异常",
        );
      }
      return response.data.data;
    },
    (error: unknown) => {
      const mapped = mapHttpError(error);
      if (mapped.status === 401) {
        clearAdminToken();
        unauthorizedHandler?.();
      }
      return Promise.reject(mapped);
    },
  );
  return client;
}

export const http = createHttpClient();

export function errorMessage(error: unknown): string {
  return mapHttpError(error).message;
}
