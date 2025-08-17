import nodemailer from "nodemailer";

export type MailConfig = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
};

export function getMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@example.com";
  if (!host || !user || !pass) return null;
  return { host, port, user, pass, from };
}

export async function sendMail(to: string[], subject: string, html: string) {
  const cfg = getMailConfig();
  if (!cfg) return { ok: false, skipped: true } as const;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transporter.sendMail({
    from: cfg.from,
    to: to.join(","),
    subject,
    html,
  });
  return { ok: true } as const;
}

export function renderAlertEmail(opts: { title: string; message: string; priority: string; itemName: string; barcode: string; warehouse: string; when?: Date | null }) {
  const { title, message, priority, itemName, barcode, warehouse, when } = opts;
  const ts = when ? new Date(when).toLocaleString() : new Date().toLocaleString();
  return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.4;">
    <h2 style="margin:0 0 8px;">${title}</h2>
    <p style="margin:0 0 8px;">Priority: <b>${priority.toUpperCase()}</b></p>
    <p style="margin:0 0 8px;">Item: <b>${itemName}</b> (${barcode})</p>
    <p style="margin:0 0 8px;">Warehouse: ${warehouse}</p>
    <p style="margin:0 0 8px;">${message}</p>
    <p style="color:#666; font-size:12px; margin:12px 0 0;">Time: ${ts}</p>
  </div>`;
}

export async function notifyStockAlert(to: string[], alert: { type: string; priority: string; message: string; inventory: { itemName: string; barcode: string; warehouseName?: string; warehouse?: string }; createdAt?: Date | string | null }) {
  if (!to || !to.length) return { ok: false, skipped: true } as const;
  const title = alert.type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  const html = renderAlertEmail({
    title,
    message: alert.message,
    priority: alert.priority,
    itemName: alert.inventory.itemName,
    barcode: alert.inventory.barcode,
    warehouse: (alert.inventory as any).warehouse || alert.inventory.warehouseName || "",
    when: alert.createdAt ? new Date(alert.createdAt as any) : new Date(),
  });
  try {
    return await sendMail(to, `[${title}] ${alert.inventory.itemName} (${alert.inventory.barcode})`, html);
  } catch (e) {
    return { ok: false, error: String(e) } as const;
  }
}
