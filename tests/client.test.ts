import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  createHttpClient,
  mapHttpError,
  setUnauthorizedHandler,
} from "@/api/client";
import { TOKEN_KEY } from "@/utils/session";

describe("Roamly HTTP 适配器", () => {
  beforeEach(() => {
    localStorage.clear();
    setUnauthorizedHandler(undefined);
  });

  it("解包字符串 OK 响应并附加管理端 Bearer Token", async () => {
    localStorage.setItem(TOKEN_KEY, "admin-token");
    const client = createHttpClient("/api");
    client.defaults.adapter = async (config) => {
      expect(config.headers.Authorization).toBe("Bearer admin-token");
      return {
        data: {
          code: "OK",
          message: "操作成功",
          data: { id: "9007199254740993" },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await expect(
      client.get<unknown, { id: string }>("/v1/admin/auth/me"),
    ).resolves.toEqual({
      id: "9007199254740993",
    });
  });

  it("拒绝若依数字码或非统一结构", async () => {
    const client = createHttpClient("/api");
    client.defaults.adapter = async (config) => ({
      data: { code: 200, data: {} },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });

    await expect(client.get("/legacy")).rejects.toMatchObject({
      code: "RESPONSE_CONTRACT_INVALID",
    });
  });

  it("401 清理管理会话并通知应用返回登录页", async () => {
    localStorage.setItem(TOKEN_KEY, "expired-token");
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    const client = createHttpClient("/api");
    client.defaults.adapter = async (config) => {
      const error = new AxiosError("unauthorized");
      error.response = {
        data: {
          code: "UNAUTHORIZED",
          message: "登录已失效，请重新登录",
          fieldErrors: [],
        },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      };
      throw error;
    };

    await expect(client.get("/v1/admin/auth/me")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it.each([401, 403, 404, 409, 429, 503])(
    "保留 HTTP %s 与后端字符串错误码",
    (status) => {
      const error = new AxiosError("request failed");
      error.response = {
        data: {
          code: `ERROR_${status}`,
          message: `错误 ${status}`,
          fieldErrors: [],
        },
        status,
        statusText: "Failed",
        headers: {},
        config: { headers: {} } as InternalAxiosRequestConfig,
      };

      const mapped = mapHttpError(error);
      expect(mapped).toBeInstanceOf(ApiError);
      expect(mapped).toMatchObject({
        status,
        code: `ERROR_${status}`,
        message: `错误 ${status}`,
      });
    },
  );
});
