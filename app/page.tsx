import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-400/80">
          Fed Rate Dashboard
        </p>
        <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">美联储加息概率仪表盘</h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
          追踪下一次 FOMC 会议的市场隐含加息、维持与降息概率，并同步展示影响政策路径的核心宏观指标。
        </p>
      </header>

      <Dashboard />
    </main>
  );
}
