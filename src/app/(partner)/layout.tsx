import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "PARTNER") {
    redirect("/login");
  }

  return <div className="min-h-screen">{children}</div>;
}
