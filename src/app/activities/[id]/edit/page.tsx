import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import ActivityForm from "@/app/components/activity-form";

export const dynamic = "force-dynamic";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;

  const activity = await db.activity.findUnique({ where: { id } });
  if (!activity) notFound();
  if (activity.hostId !== session.user.id) notFound();

  const isPast = activity.dateTime <= new Date();

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <h1
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: "var(--text-primary)",
            marginBottom: 20,
            letterSpacing: "-0.5px",
          }}
        >
          Edit activity
        </h1>

        {isPast ? (
          <div
            style={{
              padding: "20px 24px",
              borderRadius: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
            }}
          >
            This activity has already started — it can no longer be edited.
          </div>
        ) : (
          <ActivityForm
            initialData={{
              id: activity.id,
              title: activity.title,
              tags: activity.tags,
              dateTime: activity.dateTime.toISOString(),
              location: activity.location,
              maxSpots: activity.maxSpots,
              description: activity.description,
            }}
          />
        )}
      </div>
    </main>
  );
}
