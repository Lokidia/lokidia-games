import SeoManager from "./SeoManager";

export const dynamic = "force-dynamic";

export default function SeoAdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <SeoManager />
    </div>
  );
}
