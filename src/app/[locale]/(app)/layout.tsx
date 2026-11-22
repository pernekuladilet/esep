import { requireBusiness } from "@/lib/business/current";
import { CabinetHeader } from "@/components/cabinet-header";

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business } = await requireBusiness();

  return (
    <>
      <CabinetHeader businessName={business.name} />
      {children}
    </>
  );
}
