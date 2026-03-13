"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { formatThaiDateOnly } from "@/lib/format-thai-date";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  Search,
  CreditCard,
  Wrench,
  AtSign,
  Send,
  User,
  HelpCircle,
  ArrowLeft,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
} from "lucide-react";

// ==========================================
// Types
// ==========================================

interface Article {
  id: string;
  title: string;
  slug: string;
  category: CategoryKey;
  viewCount: number;
  helpfulCount: number;
  publishedAt: string;
  content?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type CategoryKey =
  | "BILLING"
  | "TECHNICAL"
  | "SENDER_NAME"
  | "DELIVERY"
  | "ACCOUNT"
  | "GENERAL";

// ==========================================
// Constants
// ==========================================

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: typeof CreditCard;
  color: string;
  colorRgb: string;
}[] = [
  {
    key: "BILLING",
    label: "การเงิน/บิล",
    icon: CreditCard,
    color: "var(--accent-purple)",
    colorRgb: "139,92,246",
  },
  {
    key: "TECHNICAL",
    label: "เทคนิค",
    icon: Wrench,
    color: "var(--info)",
    colorRgb: "71,121,255",
  },
  {
    key: "SENDER_NAME",
    label: "ชื่อผู้ส่ง",
    icon: AtSign,
    color: "var(--accent)",
    colorRgb: "0,255,167",
  },
  {
    key: "DELIVERY",
    label: "การส่ง",
    icon: Send,
    color: "var(--warning)",
    colorRgb: "250,205,99",
  },
  {
    key: "ACCOUNT",
    label: "บัญชี",
    icon: User,
    color: "var(--error)",
    colorRgb: "242,54,69",
  },
  {
    key: "GENERAL",
    label: "ทั่วไป",
    icon: HelpCircle,
    color: "var(--text-secondary)",
    colorRgb: "148,159,168",
  },
];

const CATEGORY_MAP: Record<
  CategoryKey,
  { label: string; color: string; colorRgb: string }
> = Object.fromEntries(
  CATEGORIES.map((c) => [
    c.key,
    { label: c.label, color: c.color, colorRgb: c.colorRgb },
  ])
) as Record<CategoryKey, { label: string; color: string; colorRgb: string }>;

const ARTICLES_PER_PAGE = 10;

// ==========================================
// Component: CategoryBadge
// ==========================================

function CategoryBadge({
  category,
  size = "sm",
}: {
  category: CategoryKey;
  size?: "sm" | "md";
}) {
  const cat = CATEGORY_MAP[category];
  if (!cat) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm"
      )}
      style={{
        backgroundColor: `rgba(${cat.colorRgb}, 0.1)`,
        color: cat.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: cat.color }}
      />
      {cat.label}
    </span>
  );
}

// ==========================================
// Component: ArticleSkeleton
// ==========================================

function ArticleListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card
          key={i}
          className="border-[var(--border-default)] bg-[var(--bg-surface)]"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 bg-[var(--bg-elevated)]" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full bg-[var(--bg-elevated)]" />
                  <Skeleton className="h-4 w-16 bg-[var(--bg-elevated)]" />
                  <Skeleton className="h-4 w-16 bg-[var(--bg-elevated)]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ArticleReaderSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-2/3 bg-[var(--bg-elevated)]" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-24 rounded-full bg-[var(--bg-elevated)]" />
        <Skeleton className="h-4 w-32 bg-[var(--bg-elevated)]" />
      </div>
      <Separator className="bg-[var(--border-subtle)]" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4 bg-[var(--bg-elevated)]"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Main Page Component
// ==========================================

export default function KnowledgeBasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const activeCategory = searchParams.get("category") as CategoryKey | null;
  const searchQuery = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page") || "1");
  const articleSlug = searchParams.get("article");

  // Local state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [articleLoading, setArticleLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Derived: are we in browse mode (category selected or search active)?
  const isBrowsing = !!(activeCategory || searchQuery);

  // ==========================================
  // URL helpers
  // ==========================================

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`/dashboard/support/kb?${params.toString()}`);
    },
    [router, searchParams]
  );

  // ==========================================
  // Fetch articles
  // ==========================================

  useEffect(() => {
    if (!isBrowsing || articleSlug) return;

    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (activeCategory) params.set("category", activeCategory);
    params.set("page", String(currentPage));
    params.set("limit", String(ARTICLES_PER_PAGE));

    fetch(`/api/v1/kb/articles?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setPagination(data.pagination || null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setArticles([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [isBrowsing, searchQuery, activeCategory, currentPage, articleSlug]);

  // ==========================================
  // Fetch single article
  // ==========================================

  useEffect(() => {
    if (!articleSlug) {
      setCurrentArticle(null);
      return;
    }

    const controller = new AbortController();
    setArticleLoading(true);
    setFeedbackSent(false);

    fetch(`/api/v1/kb/articles/${articleSlug}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setCurrentArticle(data || null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setCurrentArticle(null);
        }
      })
      .finally(() => setArticleLoading(false));

    return () => controller.abort();
  }, [articleSlug]);

  // ==========================================
  // Handlers
  // ==========================================

  function handleCategoryClick(key: CategoryKey) {
    if (activeCategory === key) {
      updateParams({ category: null, page: null, article: null });
    } else {
      updateParams({ category: key, page: null, article: null });
    }
  }

  function handleSearch() {
    const trimmed = searchInput.trim();
    updateParams({
      search: trimmed || null,
      page: null,
      article: null,
    });
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleArticleClick(slug: string) {
    updateParams({ article: slug });
  }

  function handleBackToList() {
    updateParams({ article: null });
  }

  function handleClearFilters() {
    setSearchInput("");
    updateParams({
      category: null,
      search: null,
      page: null,
      article: null,
    });
  }

  function handlePageChange(page: number) {
    updateParams({ page: String(page) });
  }

  async function handleFeedback(helpful: boolean) {
    if (!currentArticle || feedbackSent || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      await fetch(`/api/v1/kb/articles/${currentArticle.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      });
      setFeedbackSent(true);
    } catch {
      // silently fail — feedback is non-critical
    } finally {
      setFeedbackLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      return formatThaiDateOnly(dateStr);
    } catch {
      return dateStr;
    }
  }

  // ==========================================
  // Article Reader View
  // ==========================================

  if (articleSlug) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        {/* Back */}
        <button
          type="button"
          onClick={handleBackToList}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายการบทความ
        </button>

        {articleLoading ? (
          <ArticleReaderSkeleton />
        ) : currentArticle ? (
          <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
            <CardContent className="p-6 sm:p-8">
              {/* Title */}
              <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                {currentArticle.title}
              </h1>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <CategoryBadge
                  category={currentArticle.category}
                  size="md"
                />
                <span className="text-sm text-[var(--text-muted)]">
                  {formatDate(currentArticle.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)]">
                  <Eye className="h-3.5 w-3.5" />
                  {currentArticle.viewCount.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)]">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {currentArticle.helpfulCount.toLocaleString()}
                </span>
              </div>

              <Separator className="my-6 bg-[var(--border-subtle)]" />

              {/* Content */}
              <div
                className="kb-article-content prose prose-invert max-w-none text-[var(--text-primary)]"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(currentArticle.content || ""),
                }}
              />

              <Separator className="my-6 bg-[var(--border-subtle)]" />

              {/* Feedback */}
              <div className="flex flex-col items-center gap-3 rounded-lg bg-[var(--bg-elevated)] p-6">
                {feedbackSent ? (
                  <p className="text-sm font-medium text-[var(--accent)]">
                    ขอบคุณสำหรับ feedback
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      บทความนี้มีประโยชน์ไหม?
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={feedbackLoading}
                        onClick={() => handleFeedback(true)}
                        className="gap-1.5 border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        {feedbackLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                        มีประโยชน์
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={feedbackLoading}
                        onClick={() => handleFeedback(false)}
                        className="gap-1.5 border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--error)] hover:text-[var(--error)]"
                      >
                        {feedbackLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-4 w-4" />
                        )}
                        ไม่มีประโยชน์
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Not found */
          <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
            <CardContent className="flex flex-col items-center gap-4 p-12">
              <BookOpen className="h-12 w-12 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)]">
                ไม่พบบทความที่ต้องการ
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToList}
                className="border-[var(--border-default)] text-[var(--text-secondary)]"
              >
                กลับไปรายการ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ==========================================
  // Main KB View
  // ==========================================

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Back to support */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/support")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปศูนย์ช่วยเหลือ
      </button>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          ฐานความรู้
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          ค้นหาคำตอบจากบทความและคู่มือการใช้งาน
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="ค้นหาบทความ..."
            className="border-[var(--border-default)] bg-[var(--bg-surface)] pl-10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--accent)]"
          />
        </div>
        <Button
          onClick={handleSearch}
          className="bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90"
        >
          ค้นหา
        </Button>
      </div>

      {/* Category Grid */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          หมวดหมู่
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className={cn(
                  "group flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all",
                  "hover:border-transparent",
                  isActive
                    ? "border-transparent"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)]"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `rgba(${cat.colorRgb}, 0.12)`,
                        boxShadow: `0 0 0 1px rgba(${cat.colorRgb}, 0.3), 0 0 20px rgba(${cat.colorRgb}, 0.08)`,
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = `rgba(${cat.colorRgb}, 0.06)`;
                    e.currentTarget.style.boxShadow = `0 0 0 1px rgba(${cat.colorRgb}, 0.2)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                  style={{
                    backgroundColor: `rgba(${cat.colorRgb}, ${isActive ? 0.2 : 0.1})`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: cat.color }}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive
                      ? ""
                      : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                  )}
                  style={isActive ? { color: cat.color } : undefined}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Article List (when browsing) */}
      {isBrowsing && (
        <div className="space-y-4">
          {/* Filter info bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              {activeCategory && (
                <CategoryBadge category={activeCategory} size="sm" />
              )}
              {searchQuery && (
                <span>
                  ค้นหา: &ldquo;{searchQuery}&rdquo;
                </span>
              )}
              {pagination && (
                <span className="text-[var(--text-muted)]">
                  ({pagination.total} บทความ)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              ล้างตัวกรอง
            </button>
          </div>

          {/* Article Cards */}
          {loading ? (
            <ArticleListSkeleton />
          ) : articles.length === 0 ? (
            /* Empty state */
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardContent className="flex flex-col items-center gap-4 p-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                  <BookOpen className="h-8 w-8 text-[var(--text-muted)]" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-[var(--text-primary)]">
                    ไม่พบบทความ
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="border-[var(--border-default)] text-[var(--text-secondary)]"
                >
                  ล้างตัวกรอง
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => handleArticleClick(article.slug)}
                  className="group w-full text-left"
                >
                  <Card className="border-[var(--border-default)] bg-[var(--bg-surface)] transition-all group-hover:border-[rgba(var(--accent-rgb),0.3)] group-hover:bg-[var(--bg-elevated)]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-2">
                          <h3 className="truncate text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                            {article.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3">
                            <CategoryBadge
                              category={article.category}
                              size="sm"
                            />
                            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <Eye className="h-3 w-3" />
                              {article.viewCount.toLocaleString()}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <ThumbsUp className="h-3 w-3" />
                              {article.helpfulCount.toLocaleString()}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {formatDate(article.publishedAt)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 w-8 border-[var(--border-default)] p-0 text-[var(--text-secondary)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and neighbors
                  if (page === 1 || page === pagination.totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .reduce<(number | "dots")[]>((acc, page, idx, arr) => {
                  if (idx > 0) {
                    const prev = arr[idx - 1];
                    if (page - prev > 1) acc.push("dots");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "dots" ? (
                    <span
                      key={`dots-${idx}`}
                      className="px-1 text-xs text-[var(--text-muted)]"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(item)}
                      className={cn(
                        "h-8 w-8 border-[var(--border-default)] p-0 text-xs",
                        currentPage === item
                          ? "border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]"
                          : "text-[var(--text-secondary)]"
                      )}
                    >
                      {item}
                    </Button>
                  )
                )}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 w-8 border-[var(--border-default)] p-0 text-[var(--text-secondary)] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Initial state: prompt to explore */}
      {!isBrowsing && (
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardContent className="flex flex-col items-center gap-3 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.08)]">
              <BookOpen className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <p className="text-center text-sm text-[var(--text-secondary)]">
              เลือกหมวดหมู่หรือค้นหาเพื่อเริ่มต้น
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
