import { Suspense } from "react";
import PropertyDetailsView from "@/components/properties/PropertyDetailsView";

export const metadata = {
  title: "Property Details | Luxe Estates Dashboard",
  description: "View full property details, images, and schedule visits.",
};

export default async function DashboardPropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading property details...</div>}>
      <PropertyDetailsView propertyId={id} isDashboard={true} backHref="/dashboard/properties" />
    </Suspense>
  );
}
