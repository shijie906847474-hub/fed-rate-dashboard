# 美联储加息概率仪表盘

移动端优先的 Next.js 仪表盘，展示下一次 FOMC 会议加息/维持/降息概率，以及核心 PCE、CPI、非农、失业率四项宏观指标与 24 个月历史图表。

## 本地开发

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local，填入 FRED_API_KEY
npm run dev
```

浏览器访问 `http://localhost:3000`。

### 环境变量

| 变量 | 说明 |
|------|------|
| `FRED_API_KEY` | FRED API 密钥（免费注册） |
| `FEDWATCH_PROVIDER` | `calculated`（默认）/ `official` / `mock` |
| `CME_API_ID` | 订阅 CME FedWatch 后填写 |
| `CME_API_SECRET` | 订阅 CME FedWatch 后填写 |

## 部署到 Vercel

**当前生产地址：** https://workdata-opal.vercel.app

**GitHub 仓库：** https://github.com/shijie906847474-hub/fed-rate-dashboard

已通过 CLI 部署至 Vercel 项目 [`shijie47/work_data`](https://vercel.com/shijie47/work_data)，环境变量已配置，并已绑定 GitHub 仓库实现自动部署。手机浏览器可直接访问上述地址。

## 后期切换 CME 官方 API

1. 在 [CME Data Services](https://www.cmegroup.com/market-data/market-data-api/fedwatch-api.html) 订阅 FedWatch API
2. Vercel 添加 `CME_API_ID`、`CME_API_SECRET`
3. 设置 `FEDWATCH_PROVIDER=official`
4. 重新部署

## 数据来源

- **Calculated 模式**：CME 免费结算价 + FRED + FOMC 日程（近似计算）
- **Official 模式**：CME FedWatch 官方 REST API
- **宏观指标**：FRED（圣路易斯联储）

> 免责声明：数据仅供参考，不构成投资建议。

## 推送到 GitHub（需可访问 GitHub 的网络）

当前环境无法直连 GitHub，请在 VPN 可用时执行：

```bash
gh auth login -h github.com -p https -w
gh repo create fed-rate-dashboard --public --source=. --remote=origin --push
```

或在 GitHub 网页新建仓库 `fed-rate-dashboard` 后：

```bash
git remote add origin https://github.com/<你的用户名>/fed-rate-dashboard.git
git push -u origin master
```

然后在 [Vercel Dashboard](https://vercel.com/shijie47/work_data/settings/git) 绑定该 GitHub 仓库，即可实现 push 自动部署。
