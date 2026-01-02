import { useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { z } from "zod";
import { pb } from "@/lib/pocketbase/client";
import {
  authLoading,
  authUser,
  initAuth,
  isAuthenticated,
} from "@/lib/stores/auth";
import { SHOWCASE_CATEGORIES } from "@/lib/constants/categories";
import { slugify } from "@/lib/utils/slug";

const schema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  url: z.string().url(),
  repository: z.string().url().optional().or(z.literal("")),
  category: z.enum(SHOWCASE_CATEGORIES),
  tags: z.string().optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
});

export interface ShowcaseEditData {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  repository?: string;
  category?: string;
  tags?: string[];
  content?: string;
}

interface ShowcaseSubmitFormProps {
  mode?: "create" | "edit";
  initialData?: ShowcaseEditData;
}

function parseTags(input: string) {
  return String(input || "")
    .split(/[,，]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default function ShowcaseSubmitForm({
  mode = "create",
  initialData,
}: ShowcaseSubmitFormProps) {
  const loading = useStore(authLoading);
  const authed = useStore(isAuthenticated);
  const user = useStore(authUser);

  const isEditMode = mode === "edit" && initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [url, setUrl] = useState(initialData?.url || "");
  const [repository, setRepository] = useState(initialData?.repository || "");
  const [category, setCategory] = useState<
    (typeof SHOWCASE_CATEGORIES)[number]
  >((initialData?.category as (typeof SHOWCASE_CATEGORIES)[number]) || "saas");
  const [tags, setTags] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags.join(", ") : "",
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  const tagPreview = useMemo(() => parseTags(tags), [tags]);

  if (loading) return <p className="text-sm text-neutral-500">加载中…</p>;
  if (!authed || !user?.id) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          需要登录后才能提交案例。
        </p>
        <a
          className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
          href="/auth/login"
        >
          去登录 →
        </a>
      </div>
    );
  }

  return (
    <form
      className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setOk(null);
        setSubmitting(true);
        try {
          // Refresh auth token before submission to ensure valid session
          try {
            await pb.collection("users").authRefresh();
          } catch (authErr) {
            setError("会话已过期，请重新登录");
            setSubmitting(false);
            window.setTimeout(() => {
              window.location.href = "/auth/login";
            }, 1500);
            return;
          }

          const parsed = schema.parse({
            title,
            description,
            url,
            repository,
            category,
            tags,
            content,
          });

          const tagsArr = parseTags(parsed.tags || "");

          const form = new FormData();
          form.set("title", parsed.title);
          form.set("description", parsed.description);
          form.set("url", parsed.url);
          if (parsed.repository) form.set("repository", parsed.repository);
          form.set("category", parsed.category);
          if (tagsArr.length) form.set("tags", JSON.stringify(tagsArr));
          if (parsed.content) form.set("content", parsed.content);
          if (thumbnail) form.set("thumbnail", thumbnail);
          for (const f of screenshots) form.append("screenshots", f);

          if (isEditMode) {
            // Update existing showcase
            await pb.collection("showcase").update(initialData.id, form);
            setOk("更新成功。");
            window.setTimeout(() => {
              window.location.href = `/showcase/${initialData.slug}`;
            }, 600);
          } else {
            // Create new showcase
            const newSlug = slugify(parsed.title);
            form.set("slug", newSlug);
            await pb.collection("showcase").create(form);
            setOk("提交成功，已进入审核队列。");
            window.setTimeout(() => {
              window.location.href = "/dashboard";
            }, 600);
          }
        } catch (err: any) {
          if (err?.issues?.[0]?.message) setError(err.issues[0].message);
          else setError(err?.message || "提交失败");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm font-medium">标题</div>
          <input
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：PocketBase + Astro 作品集"
          />
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">分类</div>
          <select
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            {SHOWCASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-1">
        <div className="text-sm font-medium">简介</div>
        <textarea
          className="min-h-[110px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="说明这个项目做什么、为什么值得参考（10-1000 字）"
        />
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm font-medium">项目地址</div>
          <input
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">仓库地址（可选）</div>
          <input
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="https://github.com/owner/repo"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-1">
        <div className="text-sm font-medium">标签（逗号分隔，可选）</div>
        <input
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="saas, dashboard, ..."
        />
        {tagPreview.length ? (
          <div className="flex flex-wrap gap-2 pt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {tagPreview.map((t) => (
              <span
                key={t}
                className="rounded bg-neutral-100 px-2 py-1 dark:bg-neutral-800"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </label>

      <label className="mt-4 block space-y-1">
        <div className="text-sm font-medium">
          内容（可选，支持 Markdown/HTML）
        </div>
        <textarea
          className="min-h-[160px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写一点实现思路、用到的技术栈、经验总结…"
        />
      </label>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm font-medium">封面图（可选）</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-neutral-500">
            建议 1200×630 或 16:9，≤5MB
          </p>
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">截图（可选，最多 10 张）</div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) =>
              setScreenshots(Array.from(e.target.files || []).slice(0, 10))
            }
          />
          <p className="text-xs text-neutral-500">PNG/JPG/WebP，单张 ≤10MB</p>
        </label>
      </div>

      {error ? <p className="mt-5 text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="mt-5 text-sm text-green-700">{ok}</p> : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting
            ? isEditMode
              ? "保存中..."
              : "提交中..."
            : isEditMode
              ? "保存修改"
              : "提交"}
        </button>
        <a
          className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
          href={isEditMode ? `/showcase/${initialData?.slug}` : "/dashboard"}
        >
          {isEditMode ? "取消" : "返回我的面板"}
        </a>
      </div>
    </form>
  );
}
