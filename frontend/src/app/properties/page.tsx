import BrowsePropertiesView from "@/components/properties/BrowsePropertiesView";

export const metadata = {
  title: "Browse Properties | Luxe Estates",
  description: "Browse verified luxury listings, villas, apartments, and modern homes.",
};

export default function PropertiesPage() {
  return <BrowsePropertiesView isDashboard={false} />;
}
