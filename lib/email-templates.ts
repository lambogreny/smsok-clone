// ---------------------------------------------------------------------------
// Email Templates — SMSOK
// Each function returns { subject, html, text }
// ---------------------------------------------------------------------------

const BRAND = {
  primary: "#00E2B5",
  primaryDark: "#00C49E",
  dark: "#0b1118",
  card: "#10161c",
  text: "#b2bacd",
  textMuted: "#6b7280",
  border: "#20252c",
  white: "#FFFFFF",
  warning: "#FACD63",
  success: "#089981",
  danger: "#F23645",
} as const;

const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.io";

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="th" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>SMSOK</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.dark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.dark};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Logo -->
        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px;font-weight:700;color:${BRAND.primary};letter-spacing:-0.5px;">SMSOK</span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" style="max-width:560px;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px 28px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:${BRAND.textMuted};">
                &copy; ${new Date().getFullYear()} SMSOK — SMS Marketing Platform
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};">
                <a href="${DASHBOARD_URL}/settings/notifications" style="color:${BRAND.textMuted};text-decoration:underline;">ยกเลิกการรับอีเมล</a>
                &nbsp;&middot;&nbsp;
                <a href="${DASHBOARD_URL}/privacy" style="color:${BRAND.textMuted};text-decoration:underline;">นโยบายความเป็นส่วนตัว</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td align="center" style="background-color:${BRAND.primary};border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:${BRAND.white};text-decoration:none;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.white};line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${BRAND.text};line-height:1.6;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;">`;
}

function statRow(label: string, value: string | number): string {
  return `<tr>
  <td style="padding:8px 12px;font-size:14px;color:${BRAND.textMuted};border-bottom:1px solid ${BRAND.border};">${label}</td>
  <td style="padding:8px 12px;font-size:14px;color:${BRAND.white};text-align:right;border-bottom:1px solid ${BRAND.border};font-weight:600;">${value}</td>
</tr>`;
}

function statsTable(rows: [string, string | number][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.dark};border-radius:8px;border:1px solid ${BRAND.border};margin:16px 0;">
  ${rows.map(([l, v]) => statRow(l, v)).join("")}
</table>`;
}

// ---------------------------------------------------------------------------
// 1. Welcome
// ---------------------------------------------------------------------------

export function welcomeEmail(name: string) {
  const subject = "ยินดีต้อนรับสู่ SMSOK!";

  const html = emailLayout(`
    ${heading(`สวัสดี ${name}!`)}
    ${paragraph("ยินดีต้อนรับสู่ SMSOK — แพลตฟอร์มส่งข้อความที่ใช้งานง่ายและทรงพลัง")}
    ${paragraph("คุณได้รับ <strong style=\"color:" + BRAND.primary + ";\">15 ข้อความทดลองใช้ฟรี</strong> เพื่อเริ่มต้นใช้งาน ส่งข้อความถึงลูกค้าของคุณได้เลยวันนี้!")}
    ${statsTable([
      ["ข้อความทดลองใช้ฟรี", "15 ข้อความ"],
      ["แพ็กเกจเริ่มต้น", "100 ข้อความ"],
    ])}
    ${paragraph("เลือกแพ็กเกจตามปริมาณการใช้งานของคุณได้ พร้อมราคาแบบบาท/ข้อความที่ชัดเจนและคุ้มค่าสำหรับธุรกิจทุกขนาด")}
    ${ctaButton("ไปยังแดชบอร์ด", `${DASHBOARD_URL}/dashboard`)}
    ${paragraph("หากมีคำถามใด ๆ ตอบกลับอีเมลนี้ได้เลย ทีมงานพร้อมช่วยเหลือคุณ")}
  `);

  const text = `สวัสดี ${name}!\n\nยินดีต้อนรับสู่ SMSOK — คุณได้รับ 15 ข้อความทดลองใช้ฟรีเพื่อเริ่มต้นใช้งาน\n\nไปยังแดชบอร์ด: ${DASHBOARD_URL}/dashboard`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 2. Verification
// ---------------------------------------------------------------------------

export function verificationEmail(name: string, code: string) {
  const subject = "ยืนยันอีเมล SMSOK";

  const html = emailLayout(`
    ${heading("ยืนยันอีเมลของคุณ")}
    ${paragraph(`สวัสดี ${name}, กรุณาใช้รหัสด้านล่างเพื่อยืนยันอีเมลของคุณ`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td style="background-color:${BRAND.dark};border:2px solid ${BRAND.primary};border-radius:12px;padding:16px 40px;text-align:center;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND.white};font-family:monospace;">${code}</span>
        </td>
      </tr>
    </table>
    ${paragraph(`รหัสนี้จะหมดอายุใน <strong>15 นาที</strong>`)}
    ${paragraph(`หากคุณไม่ได้ขอรหัสนี้ กรุณาเพิกเฉยอีเมลนี้`)}
  `);

  const text = `สวัสดี ${name}\n\nรหัสยืนยันอีเมลของคุณ: ${code}\n\nรหัสนี้จะหมดอายุใน 15 นาที\nหากคุณไม่ได้ขอรหัสนี้ กรุณาเพิกเฉยอีเมลนี้`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 3. Password Reset
// ---------------------------------------------------------------------------

export function passwordResetEmail(name: string, resetUrl: string) {
  const subject = "รีเซ็ตรหัสผ่าน SMSOK";

  const html = emailLayout(`
    ${heading("รีเซ็ตรหัสผ่าน")}
    ${paragraph(`สวัสดี ${name}, เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่`)}
    ${ctaButton("รีเซ็ตรหัสผ่าน", resetUrl)}
    ${paragraph(`ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong>`)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${BRAND.warning};line-height:1.5;">
      ⚠️ หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้ รหัสผ่านปัจจุบันจะไม่ถูกเปลี่ยนแปลง
    </p>
  `);

  const text = `สวัสดี ${name}\n\nกดลิงก์เพื่อรีเซ็ตรหัสผ่าน: ${resetUrl}\n\nลิงก์นี้จะหมดอายุใน 1 ชั่วโมง\n\nหากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 4. Invoice
// ---------------------------------------------------------------------------

export function invoiceEmail(
  name: string,
  data: { invoiceNumber: string; amount: number; credits: number; date: string; pdfUrl?: string }
) {
  const subject = `ใบเสร็จ SMSOK #${data.invoiceNumber}`;

  const downloadBtn = data.pdfUrl
    ? ctaButton("ดาวน์โหลดใบเสร็จ (PDF)", data.pdfUrl)
    : "";

  const html = emailLayout(`
    ${heading("ใบเสร็จรับเงิน")}
    ${paragraph(`สวัสดี ${name}, ขอบคุณสำหรับการชำระเงิน รายละเอียดด้านล่าง`)}
    ${statsTable([
      ["เลขที่ใบเสร็จ", `#${data.invoiceNumber}`],
      ["วันที่", data.date],
      ["จำนวนเครดิต", `${data.amount.toLocaleString()} เครดิต`],
      ["ข้อความที่ได้รับ", `${data.credits.toLocaleString()} SMS`],
    ])}
    ${downloadBtn}
    ${paragraph("หากมีข้อสงสัยเกี่ยวกับใบเสร็จ สามารถตอบกลับอีเมลนี้ได้เลย")}
  `);

  const text = `สวัสดี ${name}\n\nใบเสร็จ #${data.invoiceNumber}\nวันที่: ${data.date}\nจำนวนเครดิต: ${data.amount.toLocaleString()} เครดิต\nข้อความ: ${data.credits.toLocaleString()} SMS${data.pdfUrl ? `\n\nดาวน์โหลด: ${data.pdfUrl}` : ""}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 5. Credit Low
// ---------------------------------------------------------------------------

export function creditLowEmail(
  name: string,
  data: { currentCredits: number; threshold: number }
) {
  const subject = "โควต้าข้อความ SMSOK ใกล้หมด";

  const html = emailLayout(`
    ${heading("ข้อความเหลือน้อย")}
    ${paragraph(`สวัสดี ${name}, โควต้าข้อความของคุณเหลือต่ำกว่าที่กำหนดไว้แล้ว`)}
    ${statsTable([
      ["ข้อความคงเหลือ", `${data.currentCredits.toLocaleString()} SMS`],
      ["เกณฑ์แจ้งเตือน", `${data.threshold.toLocaleString()} SMS`],
    ])}
    ${paragraph("ซื้อแพ็กเกจข้อความตอนนี้เพื่อให้แคมเปญทำงานต่อได้โดยไม่สะดุด")}
    ${ctaButton("ซื้อแพ็กเกจข้อความ", `${DASHBOARD_URL}/packages`)}
  `);

  const text = `สวัสดี ${name}\n\nข้อความเหลือน้อย: ${data.currentCredits} SMS (เกณฑ์: ${data.threshold})\n\nซื้อแพ็กเกจข้อความ: ${DASHBOARD_URL}/packages`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 6. Campaign Summary
// ---------------------------------------------------------------------------

export function campaignSummaryEmail(
  name: string,
  data: { campaignName: string; sent: number; failed: number; total: number; deliveryRate: number }
) {
  const subject = `สรุปแคมเปญ: ${data.campaignName}`;

  const rateColor = data.deliveryRate >= 95 ? BRAND.success : data.deliveryRate >= 80 ? BRAND.warning : BRAND.danger;

  const html = emailLayout(`
    ${heading(`สรุปแคมเปญ`)}
    ${paragraph(`สวัสดี ${name}, แคมเปญ <strong>"${data.campaignName}"</strong> ส่งเสร็จแล้ว`)}
    ${statsTable([
      ["ผู้รับทั้งหมด", data.total.toLocaleString()],
      ["ส่งสำเร็จ", data.sent.toLocaleString()],
      ["ส่งไม่สำเร็จ", data.failed.toLocaleString()],
    ])}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="text-align:center;padding:16px;">
          <span style="font-size:36px;font-weight:700;color:${rateColor};">${data.deliveryRate.toFixed(1)}%</span>
          <br>
          <span style="font-size:13px;color:${BRAND.textMuted};">อัตราส่งสำเร็จ</span>
        </td>
      </tr>
    </table>
    ${ctaButton("ดูรายละเอียดแคมเปญ", `${DASHBOARD_URL}/campaigns`)}
  `);

  const text = `สวัสดี ${name}\n\nสรุปแคมเปญ "${data.campaignName}"\nผู้รับทั้งหมด: ${data.total}\nส่งสำเร็จ: ${data.sent}\nส่งไม่สำเร็จ: ${data.failed}\nอัตราส่งสำเร็จ: ${data.deliveryRate.toFixed(1)}%`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 7. Security Alert
// ---------------------------------------------------------------------------

export function securityAlertEmail(
  name: string,
  data: { action: string; ip: string; userAgent: string; timestamp: string }
) {
  const subject = "\uD83D\uDD12 แจ้งเตือนความปลอดภัย SMSOK";

  const html = emailLayout(`
    ${heading("แจ้งเตือนความปลอดภัย")}
    ${paragraph(`สวัสดี ${name}, มีกิจกรรมในบัญชีของคุณที่ต้องการให้คุณทราบ`)}
    ${statsTable([
      ["กิจกรรม", data.action],
      ["IP Address", data.ip],
      ["อุปกรณ์", data.userAgent],
      ["เวลา", data.timestamp],
    ])}
    ${divider()}
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.warning};line-height:1.5;">
      หากคุณไม่ได้ทำกิจกรรมนี้ กรุณาเปลี่ยนรหัสผ่านทันทีและติดต่อทีมงาน
    </p>
    ${ctaButton("เปลี่ยนรหัสผ่าน", `${DASHBOARD_URL}/settings/security`)}
  `);

  const text = `สวัสดี ${name}\n\nแจ้งเตือนความปลอดภัย\nกิจกรรม: ${data.action}\nIP: ${data.ip}\nอุปกรณ์: ${data.userAgent}\nเวลา: ${data.timestamp}\n\nหากคุณไม่ได้ทำกิจกรรมนี้ กรุณาเปลี่ยนรหัสผ่านทันที: ${DASHBOARD_URL}/settings/security`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 8. Weekly Report
// ---------------------------------------------------------------------------

export function weeklyReportEmail(
  name: string,
  data: { smsSent: number; credits: number; campaigns: number; period: string }
) {
  const subject = "\uD83D\uDCCA รายงานประจำสัปดาห์ SMSOK";

  const html = emailLayout(`
    ${heading("รายงานประจำสัปดาห์")}
    ${paragraph(`สวัสดี ${name}, สรุปการใช้งานของคุณในสัปดาห์ที่ผ่านมา`)}
    <p style="margin:0 0 16px;font-size:13px;color:${BRAND.textMuted};">${data.period}</p>
    ${statsTable([
      ["ข้อความที่ส่ง", data.smsSent.toLocaleString()],
      ["ข้อความคงเหลือ", data.credits.toLocaleString()],
      ["แคมเปญ", data.campaigns.toLocaleString()],
    ])}
    ${ctaButton("ดูแดชบอร์ด", `${DASHBOARD_URL}/dashboard`)}
  `);

  const text = `สวัสดี ${name}\n\nรายงานประจำสัปดาห์ (${data.period})\nข้อความที่ส่ง: ${data.smsSent}\nข้อความคงเหลือ: ${data.credits}\nแคมเปญ: ${data.campaigns}\n\nดูแดชบอร์ด: ${DASHBOARD_URL}/dashboard`;

  return { subject, html, text };
}
