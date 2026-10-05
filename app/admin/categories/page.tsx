import { AdminShell, adminPanel } from "@/components/admin/admin-nav";
import { CategoryForm } from "@/components/admin/forms";
import { listAdminCategories } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories | Admin" };

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  return <AdminShell title="Categories" description={<p>Inactive categories are hidden from the shop. Categories are never deleted, so products keep their links.</p>}>
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        {categories.length === 0 && <p role="status" className="bg-card px-6 py-12 text-center text-muted-foreground">No categories yet.</p>}
        {categories.map((category) => <CategoryForm key={category.id} category={category} />)}
      </div>
      <section aria-labelledby="new-category" className={adminPanel + " self-start"}>
        <h2 id="new-category" className="text-lg">Create category</h2>
        <CategoryForm />
      </section>
    </div>
  </AdminShell>;
}
