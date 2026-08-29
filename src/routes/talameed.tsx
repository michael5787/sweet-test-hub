import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { SpaceAuth, Wordmark } from "@/components/SpaceAuth";
import { StudentResources } from "@/components/resources/StudentResources";
import { STATUS_LABEL } from "@/lib/spaces";

export const Route = createFileRoute("/talameed")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "فضاء التلاميذ — مداوروس" },
      { name: "description", content: "تسجيل الدخول وإنشاء حساب لتلاميذ مداوروس، بجلسة مستقلة عن باقي الفضاءات." },
      { property: "og:title", content: "فضاء التلاميذ — مداوروس" },
      { property: "og:description", content: "دخول التلاميذ إلى دروسهم وواجباتهم على منصة مداوروس." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Tab = "resources" | "account";

function Page() {
  const [tab, setTab] = useState<Tab>("resources");

  return (
    <SpaceAuth space="talameed">
      {({ session, profile, client, signOut }) => {
        const name = profile.full_name?.trim() || session.user.email?.split("@")[0] || "تلميذ";
        return (
          <div className="min-h-screen bg-canvas">
            <header className="app-bar">
              <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                <Wordmark space="talameed" />

                <nav className="nav-menu order-3 w-full justify-center sm:order-none sm:w-auto" aria-label="القائمة">
                  <button
                    type="button"
                    className="nav-menu-item"
                    data-active={tab === "resources"}
                    onClick={() => setTab("resources")}
                  >
                    الدروس والتمارين
                  </button>
                  <button
                    type="button"
                    className="nav-menu-item"
                    data-active={tab === "account"}
                    onClick={() => setTab("account")}
                  >
                    حسابي
                  </button>
                </nav>

                <div className="user-chip">
                  <span className="user-avatar" aria-hidden="true">
                    <UserRound size={18} />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{name}</span>
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-4xl px-4 py-10">
              {tab === "resources" ? (
                <StudentResources client={client} levelId={profile.level_id} classId={profile.class_id} />
              ) : (
                <section className="resource-card p-6 text-start">
                  <h2 className="text-lg font-semibold text-foreground">حسابي</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">الاسم</dt>
                      <dd className="font-semibold text-foreground">{name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">البريد الإلكتروني</dt>
                      <dd className="font-semibold text-foreground" dir="ltr">
                        {session.user.email}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">الحالة</dt>
                      <dd className="font-semibold text-foreground">{STATUS_LABEL[profile.status]}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={signOut} className="btn-text">
                      تسجيل الخروج
                    </button>
                  </div>
                </section>
              )}
            </main>
          </div>
        );
      }}
    </SpaceAuth>
  );
}
