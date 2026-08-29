import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  CATEGORY_LABEL,
  formatSize,
  openResource,
  useLevels,
  useResourceList,
  type Category,
  type ResourceRow,
} from "./useResources";

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
      <p className="text-sm text-muted-foreground">
        لم يتم تحديد مستواك بعد. اتصل بالإدارة لربط حسابك بقسم.
      </p>
    );
  }

  const groups: Category[] = ["cours", "exercices"];

  return (
    <section className="text-start">
      <h2 className="text-lg font-semibold text-foreground">الدروس والتمارين</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {levelName ? `ملفات المستوى: ${levelName}` : "ملفات مستواك"}
      </p>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((cat) => {
            const items = rows.filter((r) => r.category === cat);
            return (
              <div key={cat}>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{CATEGORY_LABEL[cat]}</h3>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  {items.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">لا توجد ملفات بعد.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {items.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
