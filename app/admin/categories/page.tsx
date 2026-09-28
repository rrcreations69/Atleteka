import { AdminNav } from "@/components/admin/admin-nav";
import { CategoryForm } from "@/components/admin/forms";
import { Container } from "@/components/layout/container";
import { listAdminCategories } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories | Admin | Atleteka" };

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  return <Container className="space-y-8 py-10">
    <AdminNav />
    <h1 className="text-3xl font-semibold">Categories</h1>
    <p className="text-sm text-muted-foreground">Inactive categories are hidden from the shop. Categories are never deleted, so products keep their links.</p>
    {categories.length === 0 && <p role="status">No categories yet.</p>}
    <div className="space-y-4">{categories.map((category) => <CategoryForm key={category.id} category={category} />)}</div>
    <section aria-labelledby="new-category" className="space-y-4">
      <h2 id="new-category" className="text-xl font-semibold">Create category</h2>
      <CategoryForm />
    </section>
  </Container>;
}
