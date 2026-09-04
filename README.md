# Roamly Admin Web

Roamly 平台管理 Web，用于商户入驻审核、团购券审核、订单与核销查询、Mock 退款、佣金规则、T+1 结算和操作审计。

阶段 15 至 30 的管理 Demo 能力已完成闭环：管理员认证与账号、商户/门店审核治理、券审核、订单、退款、核销、佣金账本、T+1 结算、SSE 刷新和同步 XLSX 导出。本目录是独立 Git 仓库，已完成 Vue、TypeScript、Vite、Element Plus、Pinia、Router、Vitest、Playwright、Roamly 主题、管理员认证与账号管理，以及 plus-ui 第三方声明。

开发命令为 `pnpm install --frozen-lockfile`、`pnpm verify` 和 `pnpm test:e2e`。实现范围与验收要求见 [管理 Web 契约](ADMIN_WEB_DEVELOPMENT.md)，实施顺序见 [四端交付路线图](../Roamly/docs/roadmap/FOUR_END_DELIVERY_ROADMAP.md)。

管理端视觉沿用现有 Roamly 小程序的珊瑚红、柔紫和紫灰中性色体系；竞品截图仅作业务流程参考，不作为视觉样稿。
