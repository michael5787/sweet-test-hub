import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Butterfly } from "@/components/Butterfly";
import {
  CATEGORY_LABEL,
  formatSize,
  openResource,
  useLevels,
  useResourceList,
  type Category,
  type ResourceRow,
} from "./useResources";

type Filter = "all" | Category;

export function StudentResources({
  client,
  levelId,
  classId,
}: {
  client: SupabaseClient<Database>;
  levelId: string | null;
  classId: string | null;
}) {
  const levels = useLevels(client);
  const [effectiveLevel, setEffectiveLevel] = useState<string | null>(levelId);
  const [resolved, setResolved] = useState(levelId != null || classId == null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (levelId || !classId) {
      setEffectiveLevel(levelId);
      setResolved(true);
      return;
    }
    let active = true;
    client
      .from("classes")
      .select("level_id")
      .eq("id", classId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setEffectiveLevel(data?.level_id ?? null);
        setResolved(true);
      });
    return () => {
      active = false;
    };
  }, [client, levelId, classId]);

  const { rows, loading, error, setError } = useResourceList(client, effectiveLevel);
  const levelName = levels.find((l) => l.id === effectiveLevel)?.name;

  const open = async (row: ResourceRow, download: boolean) => {
    try {
      await openResource(client, row, download);
    } catch {
      setError("تعذّر فتح الملف.");
    }
  };

  if (!resolved) {
    return <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>;
  }

  if (!effectiveLevel) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
        <Butterfly />
        <p className="text-sm text-muted-foreground">
          لم يتم تحديد مستواك بعد. اتصل بالإدارة لربط حسابك بقسم.
        </p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (filter === "all" || r.category === filter) &&
      (q === "" || r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q)),
  );

  const groups: Category[] = ["cours", "exercices"];
  const visibleGroups = groups.filter((cat) => filtered.some((r) => r.category === cat));

  return (
    <section className="text-start">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">الدروس والتمارين</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {levelName ? `ملفات المستوى: ${levelName}` : "ملفات مستواك"}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {filtered.length} ملف
        </span>
      </div>

      {/* Filter menu + search */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav className="pill-menu" aria-label="تصفية حسب النوع">
          {(["all", ...groups] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className="pill-menu-item"
              data-active={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "الكل" : CATEGORY_LABEL[f]}
            </button>
          ))}
        </nav>
        <select
          className="field-input w-auto min-w-40 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          aria-label="تصفية حسب النوع (قائمة)"
        >
          <option value="all">كل الأنواع</option>
          {groups.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABEL[cat]}
            </option>
          ))}
        </select>
        <input
          className="field-input min-w-40 flex-1 text-sm"
          placeholder="بحث في العنوان أو الوصف…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : visibleGroups.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
          <Butterfly />
          <div>
            <p className="text-sm font-semibold text-foreground">لا توجد ملفات هنا بعد</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {q !== "" || filter !== "all"
                ? "جرّب تغيير التصفية أو كلمة البحث."
                : "سيضيف أساتذتك الدروس والتمارين قريباً."}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {visibleGroups.map((cat) => {
            const items = filtered.filter((r) => r.category === cat);
            return (
              <div key={cat} className="resource-card">
                <div className="resource-card-header">
                  <span className="resource-card-dot" />
                  <h3 className="text-sm font-semibold text-foreground">{CATEGORY_LABEL[cat]}</h3>
                  <span className="ms-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {items.length}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((r) => (
                    <li
                      key={r.id}
                      className="resource-row flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground">{r.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {r.mime_type === "application/pdf" ? "PDF" : "صورة"}
                          {r.file_size ? ` • ${formatSize(r.file_size)}` : ""}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-text" onClick={() => open(r, false)}>
                          عرض
                        </button>
                        <button type="button" className="btn-text" onClick={() => open(r, true)}>
                          تحميل
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
