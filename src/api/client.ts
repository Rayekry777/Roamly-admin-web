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

function handleUnauthorized(error: ApiError): void {
  if (error.status !== 401) return;
  clearAdminToken();
  unauthorizedHandler?.();
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
      handleUnauthorized(mapped);
      return Promise.reject(mapped);
    },
  );
  return client;
}

export const http = createHttpClient();

function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

export async function mapBinaryHttpError(error: unknown): Promise<ApiError> {
  if (error instanceof ApiError) return error;
  if (!(error instanceof AxiosError) || !error.response) {
    return mapHttpError(error);
  }
  const body = error.response.data;
  if (body instanceof Blob) {
    try {
      const parsed: unknown = JSON.parse(await readBlobText(body));
      if (isErrorResult(parsed)) {
        return new ApiError(
          error.response.status,
          parsed.code,
          parsed.message,
          parsed.fieldErrors ?? [],
        );
      }
    } catch {
      // 非 JSON 二进制错误由统一契约异常处理。
    }
    return new ApiError(
      error.response.status,
      "RESPONSE_CONTRACT_INVALID",
      "服务响应格式异常",
    );
  }
  return mapHttpError(error);
}

export async function getBinary(
  path: string,
  baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api",
): Promise<Blob> {
  try {
    const response = await axios.get<Blob>(path, {
      baseURL,
      timeout: 10_000,
      responseType: "blob",
      headers: readAdminToken()
        ? { Authorization: `Bearer ${readAdminToken()}` }
        : undefined,
    });
    return response.data;
  } catch (error) {
    const mapped = await mapBinaryHttpError(error);
    handleUnauthorized(mapped);
    throw mapped;
  }
}

export function errorMessage(error: unknown): string {
  return mapHttpError(error).message;
}
