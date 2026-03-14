"use client";

export const dynamic = "force-dynamic";

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
    id: "acceptance",
    titleTh: "การยอมรับข้อตกลง",
    titleEn: "Acceptance of Terms",
    contentTh: (
      <>
        <P>
          การใช้บริการ SMSOK ถือว่าคุณยอมรับข้อตกลงการใช้บริการฉบับนี้ทั้งหมด
          หากคุณไม่ยอมรับข้อตกลงเหล่านี้ กรุณาหยุดใช้บริการทันที
        </P>
        <P>
          SMSOK ขอสงวนสิทธิ์ในการแก้ไขข้อตกลงนี้ได้ตลอดเวลา
          โดยจะแจ้งให้ทราบผ่านทางอีเมลหรือหน้าเว็บไซต์ล่วงหน้าไม่น้อยกว่า 30 วัน
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          By using SMSOK services, you agree to be bound by these Terms of Service in their entirety.
          If you do not agree to these terms, please discontinue use immediately.
        </P>
        <P>
          SMSOK reserves the right to modify these terms at any time,
          with at least 30 days advance notice via email or website.
        </P>
      </>
    ),
  },
  {
    id: "service-description",
    titleTh: "คำอธิบายบริการ",
    titleEn: "Service Description",
    contentTh: (
      <>
        <P>SMSOK ให้บริการ:</P>
        <List
          items={[
            "ส่ง SMS จำนวนมาก (Bulk SMS) ผ่านเว็บและ API",
            "บริการ OTP (One-Time Password) ผ่าน API",
            "จัดการรายชื่อผู้ติดต่อ",
            "จัดการ Sender Names",
            "รายงานและสถิติการส่ง",
            "ระบบแพ็กเกจ SMS แบบโควตา",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>SMSOK provides:</P>
        <List
          items={[
            "Bulk SMS sending via web interface and API",
            "OTP (One-Time Password) service via API",
            "Contact list management",
            "Sender Name management",
            "Delivery reports and analytics",
            "SMS quota-based package system",
          ]}
        />
      </>
    ),
  },
  {
    id: "account",
    titleTh: "บัญชีผู้ใช้",
    titleEn: "User Account",
    contentTh: (
      <>
        <P>ผู้ใช้มีหน้าที่:</P>
        <List
          items={[
            "ให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการสมัคร",
            "รักษาความลับของรหัสผ่านและ API Key",
            "แจ้งให้เราทราบทันทีหากพบการใช้งานที่ไม่ได้รับอนุญาต",
            "รับผิดชอบต่อทุกกิจกรรมที่เกิดขึ้นภายใต้บัญชีของตน",
          ]}
        />
        <P>
          เราขอสงวนสิทธิ์ในการระงับหรือปิดบัญชีที่ละเมิดข้อตกลงนี้
          หรือนโยบายการใช้งานที่ยอมรับได้ (AUP)
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>Users are responsible for:</P>
        <List
          items={[
            "Providing accurate and up-to-date registration information",
            "Maintaining the confidentiality of passwords and API Keys",
            "Notifying us immediately of any unauthorized access",
            "All activities that occur under their account",
          ]}
        />
        <P>
          We reserve the right to suspend or terminate accounts that violate these terms
          or the Acceptable Use Policy (AUP).
        </P>
      </>
    ),
  },
  {
    id: "packages-payment",
    titleTh: "แพ็กเกจและการชำระเงิน",
    titleEn: "Packages and Payment",
    contentTh: (
      <>
        <List
          items={[
            "SMS จะถูกใช้ตามระบบ FIFO (แพ็กเกจที่หมดอายุก่อนจะถูกใช้ก่อน)",
            "SMS ที่ไม่ได้ใช้จะหมดอายุตามระยะเวลาของแพ็กเกจ ไม่สามารถขอคืนได้",
            "ราคาแพ็กเกจยังไม่รวม VAT 7%",
            "การชำระเงินผ่านการโอนเงินธนาคาร ยืนยันภายใน 15-30 นาที",
            "Delivery-Failure Refund สำหรับแพ็กเกจ D ขึ้นไปเท่านั้น",
            "คูปองส่วนลดมีวันหมดอายุและเงื่อนไขการใช้งาน",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <List
          items={[
            "SMS are consumed using FIFO (earliest expiring package used first)",
            "Unused SMS expire according to package duration and are non-refundable",
            "Package prices exclude 7% VAT",
            "Payment via bank transfer, verified within 15-30 minutes",
            "Delivery-Failure Refund available for Package D and above only",
            "Discount coupons have expiration dates and usage conditions",
          ]}
        />
      </>
    ),
  },
  {
    id: "sla",
    titleTh: "ข้อตกลงระดับบริการ (SLA)",
    titleEn: "Service Level Agreement (SLA)",
    contentTh: (
      <>
        <List
          items={[
            "ความพร้อมให้บริการ (Uptime): 99.5% ต่อเดือน",
            "อัตราการส่งสำเร็จ: ≥ 95% สำหรับหมายเลขที่ถูกต้อง",
            "เวลาในการส่ง: ≤ 5 วินาที (ภายในประเทศ)",
            "การสนับสนุน: อีเมลตอบภายใน 24 ชม. (วันทำการ)",
          ]}
        />
        <P>
          หาก SLA ไม่เป็นไปตามที่ระบุ สามารถขอ SMS ชดเชยได้ตามเงื่อนไข
        </P>
      </>
    ),
    contentEn: (
      <>
        <List
          items={[
            "Service Uptime: 99.5% per month",
            "Delivery Success Rate: ≥ 95% for valid numbers",
            "Delivery Time: ≤ 5 seconds (domestic)",
            "Support: Email response within 24 hours (business days)",
          ]}
        />
        <P>
          If SLA is not met, SMS compensation may be requested according to our policy.
        </P>
      </>
    ),
  },
  {
    id: "liability",
    titleTh: "ข้อจำกัดความรับผิดชอบ",
    titleEn: "Limitation of Liability",
    contentTh: (
      <>
        <P>SMSOK จะไม่รับผิดชอบต่อ:</P>
        <List
          items={[
            "ความเสียหายจากเนื้อหา SMS ที่ผู้ใช้ส่ง",
            "ความล่าช้าหรือการส่งไม่สำเร็จอันเนื่องจากเครือข่ายของผู้ให้บริการโทรศัพท์",
            "ความเสียหายทางอ้อม ค่าเสียโอกาส หรือค่าเสียหายสืบเนื่อง",
            "เหตุสุดวิสัย (Force Majeure)",
          ]}
        />
        <P>
          ความรับผิดชอบสูงสุดของ SMSOK จำกัดเพียงมูลค่าแพ็กเกจที่ชำระในรอบ 12 เดือนล่าสุด
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>SMSOK shall not be liable for:</P>
        <List
          items={[
            "Damages arising from SMS content sent by users",
            "Delays or delivery failures due to carrier networks",
            "Indirect, incidental, or consequential damages",
            "Force Majeure events",
          ]}
        />
        <P>
          Maximum liability is limited to the package value paid in the last 12 months.
        </P>
      </>
    ),
  },
  {
    id: "governing-law",
    titleTh: "กฎหมายที่ใช้บังคับ",
    titleEn: "Governing Law",
    contentTh: (
      <P>
        ข้อตกลงนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทจะถูกระงับโดยศาลที่มีเขตอำนาจในประเทศไทย
      </P>
    ),
    contentEn: (
      <P>
        These terms are governed by Thai law. Disputes shall be resolved by the competent courts of Thailand.
      </P>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      titleTh="ข้อตกลงการใช้บริการ"
      titleEn="Terms of Service"
      subtitleTh="ข้อตกลงการใช้บริการ"
      subtitleEn="Terms of Service"
      lastUpdated="11 มีนาคม 2026"
      currentPath="/terms"
      sections={sections}
    />
  );
}
