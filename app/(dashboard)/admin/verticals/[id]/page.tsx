import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getVerticalDetails } from "@/server/actions/verticals";
import { VerticalDetailTabs } from "@/components/admin/vertical-detail-tabs";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function VerticalDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const vertical = await getVerticalDetails(params.id);

  return <VerticalDetailTabs vertical={vertical} />;
}
