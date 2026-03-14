"use client";

import LegalPageLayout from "@/components/blocks/LegalPageLayout";

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4">{children}</p>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-6 mb-4 space-y-1">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const sections = [
  {
    id: "eligibility",
    titleTh: "เงื่อนไขการขอคืนเงิน",
    titleEn: "Refund Eligibility",
    contentTh: (
      <>
        <P>
          SMSOK พิจารณาคืนเงินในกรณีดังต่อไปนี้เท่านั้น:
        </P>
        <List
          items={[
            "ระบบขัดข้อง (Downtime) เกินกว่า SLA ที่กำหนด (99.5% ต่อเดือน)",
            "ชำระเงินซ้ำโดยไม่ได้ตั้งใจ (Duplicate Payment)",
            "แพ็กเกจไม่ได้รับการเปิดใช้งานหลังชำระเงินสำเร็จ",
            "ข้อผิดพลาดของระบบที่ทำให้ไม่สามารถใช้บริการได้",
          ]}
        />
        <P>
          <strong style={{ color: "var(--text-primary)" }}>
            SMS ที่ใช้ไปแล้วไม่สามารถขอคืนเงินได้
          </strong>{" "}
          — ข้อความที่ถูกหักจากการส่ง SMS สำเร็จ ไม่ว่าผู้รับจะเปิดอ่านหรือไม่
          ถือว่าใช้งานแล้วและไม่สามารถคืนได้
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          SMSOK considers refunds only in the following cases:
        </P>
        <List
          items={[
            "System downtime exceeding the SLA guarantee (99.5% monthly uptime)",
            "Unintentional duplicate payments",
            "Package not activated after successful payment",
            "System errors preventing service usage",
          ]}
        />
        <P>
          <strong style={{ color: "var(--text-primary)" }}>
            Used SMS are non-refundable
          </strong>{" "}
          — SMS deducted for successfully sent messages, regardless of whether the
          recipient reads the message, are considered used and cannot be refunded.
        </P>
      </>
    ),
  },
  {
    id: "non-refundable",
    titleTh: "กรณีที่ไม่สามารถขอคืนเงินได้",
    titleEn: "Non-Refundable Cases",
    contentTh: (
      <>
        <P>การคืนเงินจะไม่ได้รับการพิจารณาในกรณีดังนี้:</P>
        <List
          items={[
            "SMS ที่ใช้ไปแล้ว (ส่งสำเร็จ)",
            "SMS ที่หมดอายุตามระยะเวลาของแพ็กเกจ",
            "การเปลี่ยนใจหลังซื้อแพ็กเกจและเปิดใช้งานแล้ว",
            "การถูกระงับบัญชีเนื่องจากละเมิดข้อตกลงการใช้บริการ",
            "ความล่าช้าหรือความล้มเหลวในการส่งที่เกิดจากเครือข่ายผู้ให้บริการโทรศัพท์",
            "ส่วนลดจากคูปองหรือโปรโมชัน",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>Refunds will not be granted in the following cases:</P>
        <List
          items={[
            "Used SMS (successfully sent)",
            "SMS that expired per package duration",
            "Change of mind after package activation",
            "Account suspension due to Terms of Service violations",
            "Delivery delays or failures caused by carrier networks",
            "Discounts from coupons or promotions",
          ]}
        />
      </>
    ),
  },
  {
    id: "process",
    titleTh: "ขั้นตอนการขอคืนเงิน",
    titleEn: "Refund Process",
    contentTh: (
      <>
        <P>หากคุณต้องการขอคืนเงิน กรุณาดำเนินการดังนี้:</P>
        <List
          items={[
            "เปิดตั๋วสนับสนุน (Support Ticket) ที่หน้า Dashboard → ช่วยเหลือ → สร้างตั๋วใหม่",
            "เลือกหมวดหมู่ \"การชำระเงินและบิลลิ่ง\"",
            "ระบุหมายเลขรายการชำระเงิน (Payment ID) และเหตุผลในการขอคืนเงิน",
            "แนบหลักฐานการชำระเงิน (สลิปการโอน) ถ้ามี",
          ]}
        />
        <P>
          ทีมงานจะตรวจสอบคำขอภายใน{" "}
          <strong style={{ color: "var(--text-primary)" }}>3 วันทำการ</strong>{" "}
          และแจ้งผลผ่านอีเมลที่ลงทะเบียนไว้
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>To request a refund, please follow these steps:</P>
        <List
          items={[
            "Open a Support Ticket at Dashboard → Help → Create New Ticket",
            "Select the \"Billing & Payments\" category",
            "Provide the Payment ID and reason for the refund request",
            "Attach payment proof (transfer slip) if available",
          ]}
        />
        <P>
          Our team will review your request within{" "}
          <strong style={{ color: "var(--text-primary)" }}>3 business days</strong>{" "}
          and notify you via your registered email.
        </P>
      </>
    ),
  },
  {
    id: "refund-method",
    titleTh: "วิธีการคืนเงิน",
    titleEn: "Refund Method",
    contentTh: (
      <>
        <P>การคืนเงินจะดำเนินการผ่านการโอนเงินกลับไปยังบัญชีธนาคารที่คุณใช้ชำระเงิน:</P>
        <List
          items={[
            "คืนเงินผ่านการโอนเงินธนาคาร (Bank Transfer) เท่านั้น",
            "บัญชีปลายทางต้องเป็นชื่อเดียวกับผู้สมัครใช้บริการ",
            "กรณีบัญชีธนาคารต่างธนาคาร อาจมีค่าธรรมเนียมการโอน",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>Refunds are processed via bank transfer to the account used for the original payment:</P>
        <List
          items={[
            "Refunds are issued via bank transfer only",
            "The receiving account must be under the same name as the registered user",
            "Inter-bank transfers may incur additional transfer fees",
          ]}
        />
      </>
    ),
  },
  {
    id: "timeline",
    titleTh: "ระยะเวลาดำเนินการ",
    titleEn: "Processing Timeline",
    contentTh: (
      <>
        <P>ระยะเวลาดำเนินการคืนเงินโดยประมาณ:</P>
        <List
          items={[
            "ตรวจสอบคำขอ: 1-3 วันทำการ",
            "อนุมัติและดำเนินการโอน: 3-5 วันทำการ",
            "เงินเข้าบัญชี: 1-3 วันทำการ (ขึ้นอยู่กับธนาคาร)",
            "รวมทั้งสิ้น: 5-11 วันทำการ",
          ]}
        />
        <P>
          คุณจะได้รับอีเมลแจ้งสถานะทุกขั้นตอน รวมถึงหมายเลขอ้างอิงการโอนเมื่อดำเนินการเสร็จ
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>Estimated refund processing timeline:</P>
        <List
          items={[
            "Request review: 1-3 business days",
            "Approval and transfer processing: 3-5 business days",
            "Funds received: 1-3 business days (depending on bank)",
            "Total: 5-11 business days",
          ]}
        />
        <P>
          You will receive email notifications at each step, including a transfer
          reference number upon completion.
        </P>
      </>
    ),
  },
  {
    id: "delivery-failure",
    titleTh: "การคืน SMS กรณีส่งไม่สำเร็จ (Delivery-Failure Refund)",
    titleEn: "Delivery-Failure SMS Refund",
    contentTh: (
      <>
        <P>
          สำหรับแพ็กเกจระดับ D ขึ้นไป หาก SMS ส่งไม่สำเร็จเนื่องจากปัญหาทางเทคนิคของระบบ SMSOK
          (ไม่ใช่ปัญหาจากเครือข่ายผู้ให้บริการโทรศัพท์):
        </P>
        <List
          items={[
            "SMS จะถูกคืนกลับอัตโนมัติภายใน 24 ชั่วโมง",
            "ตรวจสอบได้ที่ Dashboard → ประวัติการใช้งาน",
            "กรณีไม่ได้รับ SMS คืนอัตโนมัติ สามารถเปิดตั๋วสนับสนุนได้",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>
          For Package D and above, if SMS delivery fails due to SMSOK system issues
          (not carrier network problems):
        </P>
        <List
          items={[
            "SMS are automatically refunded within 24 hours",
            "Check at Dashboard → Usage History",
            "If automatic refund is not received, open a Support Ticket",
          ]}
        />
      </>
    ),
  },
  {
    id: "contact",
    titleTh: "การติดต่อ",
    titleEn: "Contact",
    contentTh: (
      <>
        <P>หากมีคำถามเกี่ยวกับนโยบายการคืนเงิน:</P>
        <List
          items={[
            "ฝ่ายสนับสนุน: support@smsok.com",
            "ตั๋วสนับสนุน: Dashboard → ช่วยเหลือ",
            "LINE Official: @smsok (จ.-ศ. 9:00-18:00)",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>If you have questions about this refund policy:</P>
        <List
          items={[
            "Support: support@smsok.com",
            "Support Ticket: Dashboard → Help",
            "LINE Official: @smsok (Mon-Fri 9:00-18:00)",
          ]}
        />
      </>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      titleTh="นโยบายการคืนเงิน"
      titleEn="Refund Policy"
      subtitleTh="นโยบายการคืนเงิน"
      subtitleEn="Refund Policy"
      lastUpdated="12 มีนาคม 2026"
      currentPath="/refund-policy"
      sections={sections}
    />
  );
}
