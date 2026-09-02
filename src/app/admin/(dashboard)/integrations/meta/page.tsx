import MetaCommerceCenterClient from "@/components/admin/meta/MetaCommerceCenterClient";

export const metadata = {
  title: "Meta Commerce Integration — Admin Panel",
  description: "Facebook, Instagram, Catalog, Pixel and Shopping connection status",
};

export default function MetaCommerceIntegrationPage() {
  return <MetaCommerceCenterClient />;
}
