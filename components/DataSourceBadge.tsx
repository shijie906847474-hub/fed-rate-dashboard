"use client";

import type { FedWatchData } from "@/lib/providers/types";

export function DataSourceBadge({ data }: { data: FedWatchData }) {
  const sourceLabel =
    data.source === "official"
      ? "CME FedWatch 官方 API"
      : data.source === "calculated"
        ? "Calculated（CME 结算价 + FRED）"
        : "Mock 数据";

  const updated = new Date(data.updatedAt).toLocaleString("zh-CN", {
    hour12: false,
  });

  return (
    <footer className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-xs leading-6 text-zinc-500">
      {data.stale && (
        <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-amber-300">
          {data.degradedReason ??
            "数据可能延迟，正在显示最近一次成功获取的结果。"}
        </p>
      )}
      <p>数据来源：{sourceLabel} · FRED（圣路易斯联储）</p>
      <p>最后更新：{updated}</p>
      <p>
        本页面数据仅供参考，不构成投资建议。Calculated
        模式下的概率为基于公开数据的近似计算，可能与 CME FedWatch 官方值存在差异。
      </p>
    </footer>
  );
}
