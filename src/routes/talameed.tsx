import { createFileRoute } from "@tanstack/react-router";
import { SpaceAuth } from "@/components/SpaceAuth";
import { StudentResources } from "@/components/resources/StudentResources";

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

function Page() {
  return (
    <SpaceAuth space="talameed">
      {({ session, profile, client, signOut }) => (
        <div className="min-h-screen bg-canvas px-4 py-10">
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-normal text-foreground">مرحباً بك</h1>
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                  {session.user.email}
                </p>
              </div>
              <button type="button" onClick={signOut} className="btn-text">
                تسجيل الخروج
              </button>
            </div>

            <div className="mt-10">
              <StudentResources
                client={client}
                levelId={profile.level_id}
                classId={profile.class_id}
              />
            </div>
          </div>
        </div>
      )}
    </SpaceAuth>
  );
}

