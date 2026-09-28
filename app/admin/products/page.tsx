import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { NewProductForm } from "@/components/admin/forms";
import { Container } from "@/components/layout/container";
import { listAdminProducts } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products | Admin | Atleteka" };

const activeOptions = (variants: { active: boolean }[]) => {
  const count = variants.filter((variant) => variant.active).length;
  return `${count} active ${count === 1 ? "option" : "options"}`;
};

export default async function AdminProductsPage() {
  const products = await listAdminProducts();
  return <Container className="space-y-8 py-10">
    <AdminNav />
    <h1 className="text-3xl font-semibold">Products</h1>
    {products.length === 0 ? <p role="status">No products yet.</p> : <ul className="divide-y divide-border rounded-lg border border-border">
      {products.map((product) => <li key={product.id}>
        <Link href={`/admin/products/${product.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-accent">
          <span className="min-w-0 break-words font-medium">{product.name}</span>
          <span className="text-sm text-muted-foreground">
            {product.status === "active" ? "Active" : "Archived"} · {activeOptions(product.product_variants)}
          </span>
        </Link>
      </li>)}
    </ul>}
    <section aria-labelledby="new-product" className="max-w-xl space-y-4">
      <h2 id="new-product" className="text-xl font-semibold">Create product</h2>
      <NewProductForm />
    </section>
  </Container>;
}
