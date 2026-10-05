// Pure builder for the order confirmation email (M13-P01); no I/O so it can be tested directly.

export type ConfirmationOrder = {
  id: string; createdAt: string; accountOrder: boolean;
  subtotal: string; discountTotal: string; grandTotal: string;
  address: { name: string; line1: string; line2?: string; city: string; region: string; postal_code: string };
  items: { productName: string; variantName: string; sku: string; quantity: number; unitPrice: string; lineTotal: string }[];
};

/** Store branding for the email; the caller passes it from lib/brand.ts so this module stays free of app imports. */
export type EmailStore = { name: string; ink: string; primary: string; logoUrl?: string | null };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);
const peso = (value: string) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", currencyDisplay: "code" }).format(Number(value));
const placed = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export function orderNumber(id: string) {
  return id.slice(0, 8).toUpperCase();
}

const MUTED = "#5b6275";
const LINE = "#e3e5eb";
const PAPER = "#f3f4f7";
const FONT = "font-family:Arial,Helvetica,sans-serif";

export function buildOrderConfirmation(order: ConfirmationOrder, appUrl: string, store: EmailStore) {
  const number = orderNumber(order.id);
  const link = order.accountOrder ? new URL(`/order/${order.id}`, appUrl).href : null;
  const shopUrl = new URL("/shop", appUrl).href;
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
    "",
    link ? `View your order: ${link}` : `Continue shopping: ${shopUrl}`,
    "",
    store.name,
  ].join("\n");

  // Table layout with inline styles: what email apps (Gmail, Outlook, Apple Mail) render consistently.
  const ink = escapeHtml(store.ink);
  const primary = escapeHtml(store.primary);
  const name = escapeHtml(store.name);
  const header = store.logoUrl
    ? `<img src="${escapeHtml(store.logoUrl)}" alt="${name}" height="32" style="display:block;height:32px;width:auto;border:0">`
    : `<span style="${FONT};font-size:18px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:#ffffff">${name}</span>`;
  const rows = order.items.map((item) => `<tr>
          <td style="padding:14px 0;border-bottom:1px solid ${LINE};${FONT};font-size:14px;color:${ink}">
            <strong>${escapeHtml(item.productName)}</strong><br>
            <span style="color:${MUTED}">${escapeHtml(item.variantName)} · Qty ${item.quantity}</span><br>
            <span style="color:${MUTED};font-size:12px">${peso(item.unitPrice)} each · SKU ${escapeHtml(item.sku)}</span>
          </td>
          <td align="right" style="padding:14px 0;border-bottom:1px solid ${LINE};${FONT};font-size:14px;font-weight:700;color:${ink};white-space:nowrap;vertical-align:top">${peso(item.lineTotal)}</td>
        </tr>`).join("");
  const total = (label: string, value: string, strong = false) => `<tr>
          <td style="padding:4px 0;${FONT};font-size:${strong ? 16 : 14}px;color:${strong ? ink : MUTED}${strong ? ";font-weight:700" : ""}">${label}</td>
          <td align="right" style="padding:4px 0;${FONT};font-size:${strong ? 18 : 14}px;color:${ink}${strong ? ";font-weight:700" : ""};white-space:nowrap">${value}</td>
        </tr>`;
  const button = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;background:${primary};color:#ffffff;${FONT};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:2px">${label}</a>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your ${name} order ${number}</title></head>
<body style="margin:0;padding:0;background:${PAPER}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff">
    <tr><td style="background:${ink};padding:24px 32px">${header}</td></tr>
    <tr><td style="height:4px;background:${primary};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:32px 32px 8px">
      <p style="margin:0 0 8px;${FONT};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MUTED}">Order ${number} · <span style="color:#2f6b3f;font-weight:700">Payment received</span></p>
      <h1 style="margin:0 0 8px;${FONT};font-size:26px;line-height:1.2;color:${ink}">Thank you for your order</h1>
      <p style="margin:0;${FONT};font-size:14px;color:${MUTED}">Placed ${escapeHtml(placed(order.createdAt))}</p>
    </td></tr>
    <tr><td style="padding:16px 32px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE}">${rows}</table>
    </td></tr>
    <tr><td style="padding:16px 32px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${total("Subtotal", peso(order.subtotal))}
        ${hasDiscount ? total("Discount", `−${peso(order.discountTotal)}`) : ""}
        ${total("Shipping", "Paid to the courier on delivery")}
        <tr><td colspan="2" style="padding-top:8px;border-bottom:1px solid ${LINE};font-size:0;line-height:0">&nbsp;</td></tr>
        ${total("Amount paid", peso(order.grandTotal), true)}
      </table>
      <p style="margin:4px 0 0;${FONT};font-size:12px;color:${MUTED}">Prices include tax. Shipping is not included: you pay the courier directly on delivery.</p>
    </td></tr>
    <tr><td style="padding:24px 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}"><tr><td style="padding:16px 20px;${FONT};font-size:14px;line-height:1.6;color:${ink}">
        <strong>Delivery address</strong><br>${addressLines.map(escapeHtml).join("<br>")}
      </td></tr></table>
    </td></tr>
    <tr><td align="center" style="padding:0 32px 32px">${link ? button(link, "View your order") : button(shopUrl, "Continue shopping")}</td></tr>
    <tr><td style="padding:20px 32px;border-top:1px solid ${LINE};${FONT};font-size:12px;line-height:1.6;color:${MUTED}">
      You are receiving this email because you placed an order at ${name}.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  return { subject: `Your ${store.name} order ${number}`, text, html };
}
