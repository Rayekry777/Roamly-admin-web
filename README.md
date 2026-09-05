# Roamly 管理 Web｜技术栈与解决方案

Roamly 管理 Web 是平台运营和治理工作台，覆盖管理员账号、商户/门店审核、团购券审核、订单与核销查询、退款、佣金账本、T+1 结算和操作审计。它面向平台角色，不直接持有交易事实；所有变更通过后端 `/v1` 接口完成并留下审计记录。

## 技术栈

| 领域       | 技术与版本                                             | 用途                                     |
| ---------- | ------------------------------------------------------ | ---------------------------------------- |
| 前端框架   | Vue 3.5.30、TypeScript 5.9.3                           | 组件化页面和类型安全                     |
| 构建工具   | Vite 7.3.2、Node.js 24.x、pnpm 11.x                    | 开发、构建和依赖管理                     |
| UI 与图表  | Element Plus 2.13.5、Element Plus Icons                | 管理表格、表单和反馈                     |
| 状态与路由 | Pinia 3.0.4、Vue Router 5.0.3                          | 会话、权限和页面导航                     |
| 网络层     | Axios 1.13.6                                           | 统一鉴权、响应解包和错误映射             |
| 实时通信   | EventSource（SSE）                                     | 审核、退款、核销和结算资源刷新           |
| 质量保障   | ESLint 9.39、Prettier 3.8、Vitest 4.0、Playwright 1.62 | 静态检查、单元测试、端到端测试和构建校验 |

## 核心解决方案

### 认证、路由和权限三层防线

- Axios 请求拦截器自动注入管理员 `Bearer` Token；401 统一清理会话并回到登录页，避免失效会话继续操作。
- Pinia `admin-auth` Store 管理 Token、当前管理员、首次改密标记和权限集合；登录成功后立即回查 `/v1/admin/auth/me`，不依赖客户端自报角色。
- Vue Router 路由元数据声明 `public`、`permission` 和标题，导航守卫负责登录、强制改密和无权访问跳转；页面按钮仍需以后端权限为最终依据。

### 治理与资金操作的安全边界

- 商户申请、门店和团购券审核使用明确的状态动作；操作按钮按权限和当前状态收敛，提交携带 `Idempotency-Key` 防止重复审核或重复变更。
- 退款、核销撤销、佣金规则和结算批次均展示服务端返回的金额、状态和时间；前端只提交操作意图，不重新计算资金结果。
- XLSX 导出走独立二进制请求，统一处理 Blob 错误响应，并沿用管理员鉴权；导出字段和数据范围由服务端白名单控制。

### 统一 HTTP 契约和错误体验

- `src/api` 按账号、治理、运营、财务、审核和实时能力拆分；`client.ts` 将 `{code,message,data}` 解包为业务数据，将错误转换为带状态、业务码和字段错误的 `ApiError`。
- 表格查询保留筛选条件和分页模型，详情和操作完成后按资源回查，避免本地乐观更新造成状态漂移。
- 网络失败、契约异常、字段校验和无权限分别给出可操作提示；表单错误优先定位到字段，系统错误保留后端业务码便于排查。

### SSE 实时刷新与降级

- 管理布局先通过短期票据建立 SSE，监听 `PAYMENT_UPDATED`、`REFUND_UPDATED`、`VOUCHER_REDEEMED`、`MERCHANT_REVIEWED` 和 `SETTLEMENT_UPDATED` 等资源事件。
- 事件只表示“资源发生变化”，页面收到后重新请求对应 REST 数据，资金和审核结果不依赖浏览器事件内容。
- 连接断开或票据获取失败时自动重试，并每 30 秒触发一次 `FALLBACK_REFRESH`；页面显示连接状态，保证弱网下仍可使用。

## 工程结构

```text
src
├─ api           HTTP、二进制导出和 SSE 接口
├─ stores        管理员会话与权限状态
├─ router        路由、权限元数据和导航守卫
├─ layouts       管理工作台布局与实时连接
├─ views         仪表盘、治理、交易、财务和审计页面
├─ components    表格、表单、状态和反馈组件
├─ types         HTTP、管理员、交易和财务模型
└─ styles/theme  Roamly 主题令牌与全局样式
```

页面边界和验收标准见[管理 Web 契约](ADMIN_WEB_DEVELOPMENT.md)；跨端状态机、权限和资金规则见[后端 README](../Roamly/README.md)，整体实施顺序见[四端交付路线图](../Roamly/docs/roadmap/FOUR_END_DELIVERY_ROADMAP.md)。

## 本地开发与验证

```text
pnpm install --frozen-lockfile
pnpm dev
pnpm verify
pnpm test:e2e
```

默认 API 地址为 `/api`，可通过 `VITE_API_BASE_URL` 覆盖。生产由 Nginx 提供 `/api` 前缀，前端业务路径保持 `/v1/**`，避免重复拼接前缀。
