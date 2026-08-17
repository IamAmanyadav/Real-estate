import BrowsePropertiesView from "@/components/properties/BrowsePropertiesView";

export const metadata = {
  title: "Browse Properties | Luxe Estates Admin",
  description: "Browse luxury properties directly from the admin panel.",
};

export default function AdminBrowsePropertiesPage() {
  return <BrowsePropertiesView isDashboard={true} />;
}
