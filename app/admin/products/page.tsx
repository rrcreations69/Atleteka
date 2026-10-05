import Link from "next/link";
import { AdminShell, adminPanel } from "@/components/admin/admin-nav";
import { NewProductForm } from "@/components/admin/forms";
import { listAdminProducts } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products | Admin | Atleteka" };

const activeOptions = (variants: { active: boolean }[]) => {
  const count = variants.filter((variant) => variant.active).length;
  return count + " active " + (count === 1 ? "option" : "options");
};

export default async function AdminProductsPage() {
  const products = await listAdminProducts();
  return <AdminShell title="Products" description={<p>{products.length} {products.length === 1 ? "product" : "products"}. Archived products are hidden from the shop.</p>}>
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {products.length === 0 ? <p role="status" className="bg-card px-6 py-12 text-center text-muted-foreground">No products yet.</p>
        : <ul className="self-start border-t border-border">
          {products.map((product) => <li key={product.id} className="border-b border-border">
            <Link href={"/admin/products/" + product.id} className="group flex items-center justify-between gap-4 py-4 hover:bg-accent sm:px-3">
              <span className="min-w-0">
                <span className="block break-words font-semibold group-hover:underline group-hover:underline-offset-4">{product.name}</span>
                <span className="block text-sm text-muted-foreground">{activeOptions(product.product_variants)}</span>
              </span>
              <span className={product.status === "active"
                ? "eyebrow shrink-0 rounded-sm border border-success px-2 py-0.5 text-xs font-semibold text-success"
                : "eyebrow shrink-0 rounded-sm border border-border bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground"}>
                {product.status === "active" ? "Active" : "Archived"}
              </span>
            </Link>
          </li>)}
        </ul>}
      <section aria-labelledby="new-product" className={adminPanel + " self-start"}>
        <h2 id="new-product" className="text-lg">Create product</h2>
        <NewProductForm />
      </section>
    </div>
  </AdminShell>;
}
