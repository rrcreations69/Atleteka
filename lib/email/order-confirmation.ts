// Pure builder for the order confirmation email (M13-P01); no I/O so it can be tested directly.

export type ConfirmationOrder = {
  id: string; createdAt: string; accountOrder: boolean;
  subtotal: string; discountTotal: string; grandTotal: string;
  address: { name: string; line1: string; line2?: string; city: string; region: string; postal_code: string };
  items: { productName: string; variantName: string; sku: string; quantity: number; unitPrice: string; lineTotal: string }[];
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);
const peso = (value: string) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", currencyDisplay: "code" }).format(Number(value));
const placed = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export function orderNumber(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function buildOrderConfirmation(order: ConfirmationOrder, appUrl: string) {
  const number = orderNumber(order.id);
  const link = order.accountOrder ? new URL(`/order/${order.id}`, appUrl).href : null;
  const hasDiscount = Number(order.discountTotal) > 0;
  const addressLines = [order.address.name, order.address.line1, order.address.line2, `${order.address.city}, ${order.address.region} ${order.address.postal_code}`, "Philippines"]
    .filter((line): line is string => Boolean(line));

  const text = [
    `Thank you for your order ${number}.`,
    `Placed ${placed(order.createdAt)}. Your payment was received.`,
    "",
    ...order.items.map((item) => `${item.productName} · ${item.variantName} × ${item.quantity}: ${peso(item.lineTotal)}`),
    "",
    `Subtotal: ${peso(order.subtotal)}`,
    ...(hasDiscount ? [`Discount: −${peso(order.discountTotal)}`] : []),
    `Amount paid: ${peso(order.grandTotal)} (tax included)`,
    "Shipping is not included: you pay the courier directly on delivery.",
    "",
    "Delivery address:",
    ...addressLines,
    ...(link ? ["", `View your order: ${link}`] : []),
  ].join("\n");

  const rows = order.items.map((item) => `<tr>
      <td style="padding:6px 0">${escapeHtml(item.productName)} · ${escapeHtml(item.variantName)} × ${item.quantity}<br><span style="color:#666;font-size:12px">SKU ${escapeHtml(item.sku)}</span></td>
      <td style="padding:6px 0;text-align:right;white-space:nowrap">${peso(item.lineTotal)}</td></tr>`).join("");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:16px">
  <h1 style="font-size:20px">Thank you for your order ${number}</h1>
  <p>Placed ${escapeHtml(placed(order.createdAt))}. Your payment was received.</p>
  <table style="width:100%;border-collapse:collapse">${rows}</table>
  <hr style="border:none;border-top:1px solid #ddd">
  <p>Subtotal: ${peso(order.subtotal)}${hasDiscount ? `<br>Discount: −${peso(order.discountTotal)}` : ""}<br>
  <strong>Amount paid: ${peso(order.grandTotal)}</strong> (tax included)</p>
  <p>Shipping is not included: you pay the courier directly on delivery.</p>
  <p><strong>Delivery address</strong><br>${addressLines.map(escapeHtml).join("<br>")}</p>
  ${link ? `<p><a href="${escapeHtml(link)}">View your order</a></p>` : ""}
</body></html>`;

  return { subject: `Your Atleteka order ${number}`, text, html };
}
