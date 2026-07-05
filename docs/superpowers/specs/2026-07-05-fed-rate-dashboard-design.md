# 美联储加息概率仪表盘 — 设计规格

**日期：** 2026-07-05  
**状态：** 待审阅  
**部署目标：** Vercel（账号：shijie906847474@gmail.com）

---

## 1. 目标

构建一个公网可访问的 Web 页面（移动端优先），主要展示**下一次 FOMC 会议**的市场隐含加息/降息/维持概率，辅助展示影响美联储决策的四项核心宏观指标及历史图表。

---

## 2. 需求摘要

| 维度 | 决策 |
|------|------|
| 主数据 | CME FedWatch 市场隐含概率 |
| 辅助数据 | FRED 公开 API |
| 指标 | 核心 PCE、CPI、非农就业、失业率 |
| 图表 | 完整图表区，可切换指标查看 24 个月历史 |
| 语言 | 中文为主，指标名中英双语 |
| 部署 | Vercel 云托管，HTTPS，全球 CDN |
| CME 订阅 | **现阶段不订阅**；保留官方 API 切换能力 |

---

## 3. 架构

```
┌─────────────────────────────────────────┐
│           用户（手机 / 桌面浏览器）          │
└──────────────────┬──────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────┐
│         Vercel（Next.js App）            │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  前端页面     │  │  API Routes      │  │
│  │  · 概率仪表盘 │  │  /api/fedwatch   │  │
│  │  · 指标卡片   │  │  /api/indicators │  │
│  │  · 历史图表   │  │  /api/meetings   │  │
│  └─────────────┘  └────────┬─────────┘  │
│                   ┌────────▼─────────┐  │
│                   │  内存缓存层       │  │
│                   └────────┬─────────┘  │
└────────────────────────────┼────────────┘
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌───────▼──────┐  ┌───▼────┐
     │ calculated │  │  FRED API    │  │ official│
     │ Provider   │  │  (免费)       │  │ (后期)  │
     └────────────┘  └──────────────┘  └────────┘
```

---

## 4. 数据源 Provider 抽象

通过环境变量 `FEDWATCH_PROVIDER` 切换，无需改代码。

| Provider | 环境值 | 用途 | 数据来源 | 概率历史深度 |
|----------|--------|------|----------|-------------|
| Calculated | `calculated`（默认） | 现阶段生产 | CME 免费结算价 + FRED EFFR + Fed FOMC 日程 | ~5 个交易日 |
| Official | `official` | 订阅 CME 后 | CME FedWatch REST API（OAuth 2.0） | 2015 年起 |
| Mock | `mock` | 本地开发 | 静态 JSON | 模拟数据 |

### 4.1 统一输出类型

```typescript
interface FedWatchData {
  nextMeeting: { date: string; daysRemaining: number }
  currentRate: number
  probabilities: { hike: number; hold: number; cut: number }
  rateRanges: { range: string; probability: number }[]
  history: { date: string; hike: number; hold: number; cut: number }[]
  source: 'calculated' | 'official' | 'mock'
  updatedAt: string
}
```

### 4.2 Calculated Provider 实现要点

- 从 CME Group 免费结算价 feed 获取 30-Day Fed Funds 期货价格
- 从 FRED 获取 EFFR（`DFF`）作为当前有效联邦基金利率
- 从 Federal Reserve 公开页面/API 获取 FOMC 会议日程
- 使用 CME FedWatch 近似算法计算各 outcome 概率
- 免责声明：计算值可能与 CME QuikStrike 官方值存在偏差

### 4.3 Official Provider 实现要点（预留）

- Base URL: `https://markets.api.cmegroup.com/fedwatch/v1`
- OAuth token: `https://auth.cmegroup.com/as/token.oauth2`
- 关键端点: `/forecasts`, `/meetings/future`, `/forecast/history`
- 环境变量: `CME_API_ID`, `CME_API_SECRET`

---

## 5. FRED 指标映射

| 中文名 | 英文名 | Series ID | 展示单位 |
|--------|--------|-----------|----------|
| 核心 PCE | Core PCE | `PCEPILFE` | 同比 % |
| CPI | CPI | `CPIAUCSL` | 同比 % |
| 非农就业 | Nonfarm Payrolls | `PAYEMS` | 月度增减（千人） |
| 失业率 | Unemployment Rate | `UNRATE` | % |

辅助 Series（Calculated Provider 用）:

| 用途 | Series ID |
|------|-----------|
| 有效联邦基金利率 | `DFF` |
| 联邦基金目标利率 | `DFEDTARU` / `DFEDTARL` |

---

## 6. API 路由

| 路由 | 方法 | 作用 | 缓存 TTL |
|------|------|------|----------|
| `/api/fedwatch` | GET | 下一次 FOMC 概率 + 短期历史 | 15 分钟 |
| `/api/indicators` | GET | 四件套最新值 + 环比变化 | 1 小时 |
| `/api/indicators/[id]/history` | GET | 单指标 24 个月历史 | 6 小时 |
| `/api/meetings` | GET | 未来 FOMC 会议日程 | 24 小时 |

所有 API 返回 JSON，前端通过 SWR 每 15 分钟自动刷新。

---

## 7. 页面布局（移动端优先）

1. **Hero 区** — 下一次 FOMC 日期 + 倒计时
2. **核心概率** — 加息 / 维持 / 降息 概率（环形图 + 大号数字）
3. **指标卡片** — 四件套横向滑动（scroll-snap）
4. **图表区** — Tab 切换指标，24 个月历史曲线
5. **页脚** — 数据来源标识、最后更新时间、免责声明

### 视觉方向

金融终端风格：深色背景、高对比度数字、绿涨红跌、专业克制。

---

## 8. 项目结构

```
fed-rate-dashboard/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── api/
│       ├── fedwatch/route.ts
│       ├── indicators/route.ts
│       ├── indicators/[id]/history/route.ts
│       └── meetings/route.ts
├── components/
│   ├── ProbabilityHero.tsx
│   ├── IndicatorCards.tsx
│   ├── HistoryChart.tsx
│   ├── MeetingCountdown.tsx
│   └── DataSourceBadge.tsx
├── lib/
│   ├── providers/
│   │   ├── types.ts
│   │   ├── index.ts          # 按 env 选择 provider
│   │   ├── calculated.ts
│   │   ├── official.ts
│   │   └── mock.ts
│   ├── fred.ts
│   ├── cache.ts
│   └── constants.ts
├── .env.example
├── .gitignore
├── package.json
└── vercel.json
```

---

## 9. 技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 框架 | Next.js 14 (App Router) | Vercel 原生，API Route 内置 |
| 样式 | Tailwind CSS | 响应式快，移动端友好 |
| 图表 | Lightweight Charts | 金融场景专业，触摸交互好 |
| 数据获取 | SWR | 客户端自动轮询 + 缓存 |
| 部署 | Vercel | 免费额度，HTTPS，全球 CDN |

---

## 10. 环境变量

```env
# .env.example — 不含真实密钥
FRED_API_KEY=your_fred_api_key
FEDWATCH_PROVIDER=calculated   # calculated | official | mock

# 仅 official provider 需要（后期）
CME_API_ID=
CME_API_SECRET=
```

真实密钥通过 Vercel Dashboard → Settings → Environment Variables 配置，**禁止提交到 Git**。

---

## 11. 错误处理

| 场景 | 行为 |
|------|------|
| CME 结算价获取失败 | 返回缓存旧数据 + 顶部「数据可能延迟」横幅 |
| FRED API 失败 | 指标卡片显示「—」，主概率区不受影响 |
| 全部数据源失败 | 友好错误页 + localStorage 上次成功数据备份 |
| Provider 配置错误 | 500 + 明确错误信息（仅开发环境显示详情） |

---

## 12. 部署流程

1. 代码推送到 GitHub 仓库
2. Vercel 导入项目（Google 账号 shijie906847474@gmail.com）
3. 配置环境变量 `FRED_API_KEY`、`FEDWATCH_PROVIDER=calculated`
4. 自动部署，获得 `*.vercel.app` 域名
5. 可选：绑定自定义域名

---

## 13. 后期升级路径（订阅 CME 后）

1. 在 CME Data Services Portal 订阅 FedWatch EOD API（~$25/月）
2. 获取 OAuth API ID 和 Secret
3. Vercel 添加 `CME_API_ID`、`CME_API_SECRET`
4. 修改 `FEDWATCH_PROVIDER=official`
5. 重新部署 — 自动切换，概率历史扩展至 2015 年

---

## 14. 免责声明（页面展示）

> 本页面数据仅供参考，不构成投资建议。Calculated 模式下的概率为基于公开数据的近似计算，可能与 CME FedWatch 官方值存在差异。数据来源于 CME Group、FRED（圣路易斯联储）及美联储公开信息。
