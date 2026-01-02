import { useEffect, useMemo, useState } from "react";
import { POCKETBASE_URL } from "@/lib/constants/config";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type DownloadFile = {
  id: string;
  version: string;
  platform: string;
  arch: string;
  checksum?: string;
  size?: number;
  prerelease?: boolean;
  published_at?: string | null;
  url?: string | null;
};

function guessClientTarget() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  const platform = (() => {
    if (/windows/i.test(ua)) return "windows";
    if (/macintosh|mac os x/i.test(ua)) return "darwin";
    if (/linux/i.test(ua)) return "linux";
    return "";
  })();

  const arch = (() => {
    if (/arm64|aarch64/i.test(ua)) return "arm64";
    if (/armv7/i.test(ua)) return "armv7";
    if (/ppc64le/i.test(ua)) return "ppc64le";
    if (/s390x/i.test(ua)) return "s390x";
    if (/x86_64|win64|x64|amd64/i.test(ua)) return "amd64";
    if (/i386|i686|x86/i.test(ua)) return "386";
    return "";
  })();

  if (!platform || !arch) return null;
  return { platform, arch };
}

function bytes(n?: number) {
  const v = Number(n || 0);
  if (!v) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = v;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function DownloadsBrowserContent() {
  const [versions, setVersions] = useState<string[]>([]);
  const [version, setVersion] = useState<string>("");
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [target, setTarget] = useState<{
    platform: string;
    arch: string;
  } | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedChecksum, setCopiedChecksum] = useState<string | null>(null);

  const versionsUrl = useMemo(
    () => new URL("/api/downloads/versions", POCKETBASE_URL).toString(),
    [],
  );

  useEffect(() => {
    setTarget(guessClientTarget());
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadingVersions(true);
    fetch(versionsUrl, { headers: { Accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!alive) return;
        const list = Array.isArray(json?.data) ? json.data : [];
        setVersions(list);
        setVersion(list[0] || "");
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "加载失败");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingVersions(false);
      });
    return () => {
      alive = false;
    };
  }, [versionsUrl]);

  useEffect(() => {
    if (!version) return;
    let alive = true;
    setLoadingFiles(true);
    setError(null);

    const url = new URL("/api/downloads/files", POCKETBASE_URL);
    url.searchParams.set("version", version);

    fetch(url.toString(), { headers: { Accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!alive) return;
        setFiles(Array.isArray(json?.data) ? json.data : []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "加载失败");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingFiles(false);
      });

    return () => {
      alive = false;
    };
  }, [version]);

  const recommended = useMemo(() => {
    if (!target) return null;
    return (
      files.find(
        (f) => f.platform === target.platform && f.arch === target.arch,
      ) || null
    );
  }, [files, target]);

  const copyChecksum = async (checksum: string) => {
    try {
      await navigator.clipboard.writeText(checksum);
      setCopiedChecksum(checksum);
      setTimeout(() => setCopiedChecksum(null), 2000);
    } catch {
      // Silently fail if clipboard access is denied
    }
  };

  const trackDownload = async (file: DownloadFile) => {
    try {
      await fetch(new URL("/api/downloads/track", POCKETBASE_URL).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: file.version,
          platform: file.platform,
          arch: file.arch,
        }),
      });
    } catch {
      // Silently fail tracking - download should still work
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {loadingVersions ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner size="sm" />
              加载版本中…
            </span>
          ) : (
            `共 ${versions.length} 个版本`
          )}
        </div>
        <label htmlFor="version-select" className="sr-only">
          选择版本
        </label>
        <select
          id="version-select"
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 md:w-56"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          disabled={loadingVersions || versions.length === 0}
        >
          {versions.map((v) => (
            <option key={v} value={v}>
              v{v}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900 dark:text-red-300"
          >
            刷新重试
          </button>
        </div>
      ) : null}

      {loadingFiles ? <TableSkeleton rows={5} columns={5} /> : null}

      {!loadingFiles && recommended ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm dark:border-brand-900/40 dark:bg-brand-950/30">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium">推荐下载</div>
              <div className="text-neutral-700 dark:text-neutral-200">
                {recommended.platform} / {recommended.arch} ·{" "}
                {bytes(recommended.size)}
              </div>
            </div>
            {recommended.url ? (
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                href={recommended.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackDownload(recommended)}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                下载 v{recommended.version}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {!loadingFiles && files.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2" scope="col">
                  平台
                </th>
                <th className="px-4 py-2" scope="col">
                  架构
                </th>
                <th className="px-4 py-2" scope="col">
                  大小
                </th>
                <th className="px-4 py-2" scope="col">
                  校验
                </th>
                <th className="px-4 py-2" scope="col">
                  链接
                </th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr
                  key={f.id}
                  className={[
                    "border-t border-neutral-200 dark:border-neutral-800",
                    recommended?.id === f.id
                      ? "bg-brand-50/70 dark:bg-brand-950/20"
                      : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-2">{f.platform}</td>
                  <td className="px-4 py-2">{f.arch}</td>
                  <td className="px-4 py-2">{bytes(f.size)}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {f.checksum ? (
                      <span className="inline-flex items-center gap-2">
                        <span title={f.checksum}>
                          {f.checksum.slice(0, 12)}…
                        </span>
                        <button
                          type="button"
                          className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                          onClick={() => copyChecksum(f.checksum!)}
                          aria-label={`复制校验值 ${f.checksum.slice(0, 12)}`}
                        >
                          {copiedChecksum === f.checksum ? "已复制" : "复制"}
                        </button>
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {f.url ? (
                      <a
                        className="text-brand-700 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded dark:text-brand-300"
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackDownload(f)}
                      >
                        下载
                      </a>
                    ) : (
                      <span className="text-neutral-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loadingFiles && files.length === 0 && !error ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500">
            暂无文件记录。请确认后端已运行同步任务，或管理员手动触发同步。
          </p>
        </div>
      ) : null}

      <div className="text-xs text-neutral-500">
        校验值来自 GitHub Release 的{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">
          checksums.txt
        </code>
        （若存在）；若为空表示上游未提供或尚未解析。
      </div>
    </div>
  );
}

export default function DownloadsBrowser() {
  return (
    <ErrorBoundary>
      <DownloadsBrowserContent />
    </ErrorBoundary>
  );
}
