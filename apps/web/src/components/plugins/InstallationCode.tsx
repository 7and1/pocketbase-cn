import { useState, useCallback } from "react";

interface InstallationCodeProps {
  pluginName: string;
  pluginSlug: string;
  latestVersion?: string;
  pocketbaseVersions?: string[];
}

type Framework =
  | "vue"
  | "react"
  | "svelte"
  | "vanilla"
  | "next"
  | "nuxt"
  | "astro";

const FRAMEWORKS: Record<Framework, { label: string; icon: string }> = {
  vue: { label: "Vue", icon: "🟢" },
  react: { label: "React", icon: "⚛️" },
  svelte: { label: "Svelte", icon: "🔥" },
  vanilla: { label: "Vanilla JS", icon: "📜" },
  next: { label: "Next.js", icon: "▲" },
  nuxt: { label: "Nuxt", icon: "🟢" },
  astro: { label: "Astro", icon: "🚀" },
};

const generateInstallCommand = (
  framework: Framework,
  pluginName: string,
  version?: string,
): string => {
  const versionSuffix = version ? `@${version}` : "";
  switch (framework) {
    case "vue":
    case "react":
    case "svelte":
    case "vanilla":
      return `npm install ${pluginName}${versionSuffix}`;
    case "next":
    case "nuxt":
    case "astro":
      return `npm install ${pluginName}${versionSuffix}`;
    default:
      return `npm install ${pluginName}${versionSuffix}`;
  }
};

const generateUsageCode = (
  framework: Framework,
  pluginName: string,
  pluginSlug: string,
): string => {
  switch (framework) {
    case "vue":
      return `import { createApp } from 'vue'
import PocketBase from 'pocketbase'
import ${pluginName} from '${pluginName}'

const pb = new PocketBase('http://127.0.0.1:8090')

const app = createApp({
  setup() {
    ${pluginName}.init(pb)
    return {}
  }
})

app.mount('#app')`;

    case "react":
      return `import { useEffect } from 'react'
import PocketBase from 'pocketbase'
import ${pluginName} from '${pluginName}'

export function App() {
  useEffect(() => {
    const pb = new PocketBase('http://127.0.0.1:8090')
    ${pluginName}.init(pb)
  }, [])

  return <div>App</div>
}`;

    case "svelte":
      return `import PocketBase from 'pocketbase'
import ${pluginName} from '${pluginName}'
import { onMount } from 'svelte'

const pb = new PocketBase('http://127.0.0.1:8090')

onMount(() => {
  ${pluginName}.init(pb)
})`;

    case "vanilla":
      return `import PocketBase from 'pocketbase'
import ${pluginName} from '${pluginName}'

const pb = new PocketBase('http://127.0.0.1:8090')
${pluginName}.init(pb)`;

    case "next":
      return `import PocketBase from 'pocketbase'
import ${pluginName} from '${pluginName}'

export default function Layout({ children }) {
  useEffect(() => {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
    ${pluginName}.init(pb)
  }, [])
  return <>{children}</>
}`;

    case "nuxt":
      return `// plugins/pocketbase.ts
import PocketBase from 'pocketbase'
import ${pluginName} from '${pluginName}'

export default defineNuxtPlugin(() => {
  const pb = new PocketBase(process.env.NUXT_PUBLIC_POCKETBASE_URL)
  ${pluginName}.init(pb)
})`;

    case "astro":
      return `// src/integrations/pocketbase.ts
import pocketbase from '@astrojs/pocketbase'
import ${pluginName} from '${pluginName}'

export default {
  name: '${pluginName}-integration',
  hooks: {
    'astro:config:setup': () => {
      ${pluginName}.init()
    }
  }
}`;

    default:
      return `import ${pluginName} from '${pluginName}'`;
  }
};

const generateEnvTemplate = (framework: Framework): string => {
  switch (framework) {
    case "next":
      return `NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090`;
    case "nuxt":
      return `NUXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090`;
    case "astro":
      return `PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090`;
    default:
      return `VITE_POCKETBASE_URL=http://127.0.0.1:8090`;
  }
};

const TROUBLESHOOTING_TIPS = [
  {
    title: "连接失败",
    solution: "确保 PocketBase 服务正在运行，并且 URL 配置正确。",
  },
  {
    title: "类型错误",
    solution:
      "确保安装了 TypeScript 类型定义：npm install -D @types/pocketbase",
  },
  {
    title: "CORS 错误",
    solution: "在 PocketBase 中配置 CORS 设置，允许您的域名访问。",
  },
  {
    title: "钩子不执行",
    solution: "确认插件文件放置在 pb_hooks 目录下，且文件名以 .pb.js 结尾。",
  },
];

export default function InstallationCode({
  pluginName,
  pluginSlug,
  latestVersion,
  pocketbaseVersions = [],
}: InstallationCodeProps) {
  const [framework, setFramework] = useState<Framework>("vue");
  const [copied, setCopied] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const installCommand = generateInstallCommand(
    framework,
    pluginName,
    latestVersion,
  );
  const usageCode = generateUsageCode(framework, pluginName, pluginSlug);
  const envTemplate = generateEnvTemplate(framework);

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Framework Selector */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          选择框架
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FRAMEWORKS) as Framework[]).map((fw) => (
            <button
              key={fw}
              type="button"
              onClick={() => setFramework(fw)}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                framework === fw
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950 dark:text-brand-300"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
              }`}
              aria-pressed={framework === fw}
            >
              <span className="mr-1">{FRAMEWORKS[fw].icon}</span>
              {FRAMEWORKS[fw].label}
            </button>
          ))}
        </div>
      </div>

      {/* Installation Command */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            安装命令
          </h3>
          <button
            type="button"
            onClick={() => copyToClipboard(installCommand, "install")}
            className="rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
            aria-label="复制安装命令"
          >
            {copied === "install" ? "已复制!" : "复制"}
          </button>
        </div>
        <div className="overflow-hidden rounded-lg bg-neutral-900 p-3">
          <code className="text-sm text-neutral-100">{installCommand}</code>
        </div>
      </div>

      {/* Usage Code */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            使用示例
          </h3>
          <button
            type="button"
            onClick={() => copyToClipboard(usageCode, "usage")}
            className="rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
            aria-label="复制使用代码"
          >
            {copied === "usage" ? "已复制!" : "复制"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-3">
          <code className="text-sm text-neutral-100">{usageCode}</code>
        </pre>
      </div>

      {/* Environment Variables */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            环境变量 (.env)
          </h3>
          <button
            type="button"
            onClick={() => copyToClipboard(envTemplate, "env")}
            className="rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
            aria-label="复制环境变量"
          >
            {copied === "env" ? "已复制!" : "复制"}
          </button>
        </div>
        <div className="overflow-hidden rounded-lg bg-neutral-900 p-3">
          <code className="text-sm text-neutral-100">{envTemplate}</code>
        </div>
      </div>

      {/* PocketBase Compatibility */}
      {pocketbaseVersions.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            PocketBase 版本兼容性
          </h3>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap gap-2">
              {pocketbaseVersions.map((v) => (
                <span
                  key={v}
                  className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Troubleshooting */}
      <div>
        <button
          type="button"
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
          aria-expanded={showTroubleshooting}
        >
          <span>故障排除提示</span>
          <svg
            className={`h-4 w-4 text-neutral-500 transition-transform dark:text-neutral-400 ${
              showTroubleshooting ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {showTroubleshooting ? (
          <div className="mt-2 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            {TROUBLESHOOTING_TIPS.map((tip, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {tip.title}
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {tip.solution}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
