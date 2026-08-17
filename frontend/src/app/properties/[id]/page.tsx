import { Suspense } from "react";
import PropertyDetailsView from "@/components/properties/PropertyDetailsView";

export const metadata = {
  title: "Property Details | Luxe Estates",
  description: "View luxury property details, verified photo gallery, and schedule visits.",
};

export default async function PublicPropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="pt-24 pb-16 text-center text-sm text-muted-foreground">Loading property details...</div>}>
      <PropertyDetailsView propertyId={id} isDashboard={false} backHref="/properties" />
    </Suspense>
  );
}
