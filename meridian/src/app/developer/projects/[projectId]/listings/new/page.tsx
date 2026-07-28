import { Card, CardContent } from "@/components/ui/card";
import { CreateListingForm } from "@/components/developer/create-listing-form";

export default async function NewListingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Add a listing</h1>
      <Card>
        <CardContent className="pt-6">
          <CreateListingForm projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
