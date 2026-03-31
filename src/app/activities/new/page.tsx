import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ActivityForm from "@/app/components/activity-form";

export default async function NewActivityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

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
            letterSpacing: "-0.5px",
            color: "var(--text-primary)",
            marginBottom: 20,
            paddingLeft: 4,
          }}
        >
          Create activity
        </h1>
        <ActivityForm />
      </div>
    </main>
  );
}
