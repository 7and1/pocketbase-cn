import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "pb-cookie-consent";

type ConsentValue = "all" | "essential" | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "all" || stored === "essential") {
      setConsent(stored);
    } else {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "all");
    setConsent("all");
    setVisible(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pb:consent", { detail: "all" }));
      const w = window as typeof window & {
        __pbAnalytics?: { loadAll?: () => void };
      };
      w.__pbAnalytics?.loadAll?.();
    }
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "essential");
    setConsent("essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <h2 id="cookie-consent-title" className="font-semibold">
        Cookie 使用说明
      </h2>
      <p
        id="cookie-consent-description"
        className="mt-2 text-sm text-neutral-600 dark:text-neutral-400"
      >
        我们使用 Cookie 来改善您的浏览体验、分析网站流量。您可以选择接受所有
        Cookie，或仅接受必要的 Cookie。
        <a
          href="/legal/privacy"
          className="ml-1 text-brand-700 hover:underline dark:text-brand-300"
        >
          隐私政策
        </a>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAcceptAll}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          接受所有
        </button>
        <button
          type="button"
          onClick={handleRejectNonEssential}
          className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          仅必要 Cookie
        </button>
      </div>
    </div>
  );
}
