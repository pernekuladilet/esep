import { requireBusiness } from "@/lib/business/current";
import { ImportFlow } from "@/components/imports/import-flow";

export default async function ImportStatementPage() {
  await requireBusiness();

  return (
    <main className="mx-auto flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
      <ImportFlow />
    </main>
  );
}
