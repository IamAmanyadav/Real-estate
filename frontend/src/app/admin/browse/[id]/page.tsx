import { Suspense } from "react";
import PropertyDetailsView from "@/components/properties/PropertyDetailsView";

export const metadata = {
  title: "Property Details | Luxe Estates Admin",
  description: "View full property details, images, and verified listing specs.",
};

export default async function AdminBrowsePropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading property details...</div>}>
      <PropertyDetailsView propertyId={id} isDashboard={true} backHref="/admin/browse" />
    </Suspense>
  );
}
