import BrowsePropertiesView from "@/components/properties/BrowsePropertiesView";

export const metadata = {
  title: "Browse Properties | Luxe Estates Dashboard",
  description: "Browse luxury properties directly from your dashboard.",
};

export default function DashboardBrowsePropertiesPage() {
  return <BrowsePropertiesView isDashboard={true} />;
}
