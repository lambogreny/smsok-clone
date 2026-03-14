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
    id: "data-collection",
    titleTh: "ข้อมูลที่เราเก็บรวบรวม",
    titleEn: "Information We Collect",
    contentTh: (
      <>
        <P>เราเก็บรวบรวมข้อมูลส่วนบุคคลดังต่อไปนี้เมื่อคุณใช้บริการ SMSOK:</P>
        <List
          items={[
            "ข้อมูลบัญชี: ชื่อ, อีเมล, เบอร์โทรศัพท์, รหัสผ่าน (เข้ารหัส)",
            "ข้อมูลธุรกิจ: ชื่อบริษัท, เลขประจำตัวผู้เสียภาษี, ที่อยู่",
            "ข้อมูลการใช้งาน: ประวัติการส่ง SMS, รายชื่อผู้ติดต่อ, Sender Names",
            "ข้อมูลการชำระเงิน: ประวัติธุรกรรม, หลักฐานการโอนเงิน",
            "ข้อมูลทางเทคนิค: IP address, User Agent, cookies",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>We collect the following personal data when you use SMSOK services:</P>
        <List
          items={[
            "Account information: Name, email, phone number, password (encrypted)",
            "Business information: Company name, tax ID, address",
            "Usage data: SMS sending history, contact lists, Sender Names",
            "Payment data: Transaction history, bank transfer receipts",
            "Technical data: IP address, User Agent, cookies",
          ]}
        />
      </>
    ),
  },
  {
    id: "purpose",
    titleTh: "วัตถุประสงค์ในการเก็บข้อมูล",
    titleEn: "Purpose of Data Collection",
    contentTh: (
      <>
        <P>เราใช้ข้อมูลส่วนบุคคลของคุณเพื่อ:</P>
        <List
          items={[
            "ให้บริการส่ง SMS ตามที่คุณร้องขอ",
            "ยืนยันตัวตนและรักษาความปลอดภัยของบัญชี",
            "ประมวลผลการชำระเงินและออกใบกำกับภาษี",
            "ส่งการแจ้งเตือนเกี่ยวกับบริการ (เช่น SMS เหลือน้อย, แพ็กเกจใกล้หมดอายุ)",
            "ปรับปรุงและพัฒนาบริการ",
            "ปฏิบัติตามกฎหมายและข้อบังคับที่เกี่ยวข้อง",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>We use your personal data to:</P>
        <List
          items={[
            "Provide SMS sending services as requested",
            "Verify identity and maintain account security",
            "Process payments and issue tax invoices",
            "Send service notifications (e.g., low SMS remaining, package expiry)",
            "Improve and develop our services",
            "Comply with applicable laws and regulations",
          ]}
        />
      </>
    ),
  },
  {
    id: "sharing",
    titleTh: "การแบ่งปันข้อมูล",
    titleEn: "Data Sharing",
    contentTh: (
      <>
        <P>เราจะไม่ขาย แลกเปลี่ยน หรือเปิดเผยข้อมูลส่วนบุคคลของคุณให้บุคคลที่สาม ยกเว้น:</P>
        <List
          items={[
            "ผู้ให้บริการ SMS Gateway ที่จำเป็นสำหรับการส่งข้อความ",
            "ผู้ให้บริการชำระเงิน (ธนาคาร, EasySlip)",
            "หน่วยงานราชการตามที่กฎหมายกำหนด",
            "ด้วยความยินยอมของคุณ",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>We will not sell, trade, or disclose your personal data to third parties except:</P>
        <List
          items={[
            "SMS Gateway providers necessary for message delivery",
            "Payment processors (banks, EasySlip)",
            "Government authorities as required by law",
            "With your explicit consent",
          ]}
        />
      </>
    ),
  },
  {
    id: "rights",
    titleTh: "สิทธิ์ของเจ้าของข้อมูล",
    titleEn: "Data Subject Rights",
    contentTh: (
      <>
        <P>ภายใต้ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA) คุณมีสิทธิ์:</P>
        <List
          items={[
            "สิทธิ์เข้าถึงข้อมูล — ขอดูข้อมูลส่วนบุคคลที่เราจัดเก็บ",
            "สิทธิ์ขอลบข้อมูล — ขอให้ลบข้อมูลส่วนบุคคลของคุณ",
            "สิทธิ์โอนย้ายข้อมูล — ขอรับข้อมูลในรูปแบบที่อ่านได้ (JSON/CSV)",
            "สิทธิ์คัดค้าน — คัดค้านการประมวลผลข้อมูลบางประเภท",
            "สิทธิ์แก้ไขข้อมูล — ขอแก้ไขข้อมูลที่ไม่ถูกต้อง",
            "สิทธิ์ถอนความยินยอม — ถอนความยินยอมที่เคยให้ไว้",
          ]}
        />
        <P>
          คุณสามารถใช้สิทธิ์เหล่านี้ได้ที่{" "}
          <strong style={{ color: "var(--text-primary)" }}>ตั้งค่า &gt; สิทธิ์ข้อมูลส่วนบุคคล</strong>{" "}
          หรือติดต่อ dpo@smsok.com
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>Under the Personal Data Protection Act (PDPA), you have the right to:</P>
        <List
          items={[
            "Right of Access — request to view your personal data we store",
            "Right to Erasure — request deletion of your personal data",
            "Right to Data Portability — receive data in a readable format (JSON/CSV)",
            "Right to Object — object to certain types of data processing",
            "Right to Rectification — request correction of inaccurate data",
            "Right to Withdraw Consent — withdraw previously given consent",
          ]}
        />
        <P>
          You can exercise these rights at{" "}
          <strong style={{ color: "var(--text-primary)" }}>Settings &gt; Data Privacy Rights</strong>{" "}
          or contact dpo@smsok.com
        </P>
      </>
    ),
  },
  {
    id: "security",
    titleTh: "การรักษาความปลอดภัย",
    titleEn: "Security",
    contentTh: (
      <>
        <P>เรามีมาตรการรักษาความปลอดภัยดังนี้:</P>
        <List
          items={[
            "เข้ารหัสข้อมูลระหว่างการส่ง (TLS/SSL) และจัดเก็บ (AES-256)",
            "รหัสผ่านเข้ารหัสด้วย bcrypt",
            "รองรับการยืนยันตัวตนสองชั้น (2FA/TOTP)",
            "ตรวจสอบ API Key ทุกคำขอ",
            "จำกัดอัตราการเรียกใช้ API (Rate Limiting)",
            "บันทึก Audit Log ทุกกิจกรรม",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>We implement the following security measures:</P>
        <List
          items={[
            "Data encryption in transit (TLS/SSL) and at rest (AES-256)",
            "Passwords hashed with bcrypt",
            "Two-factor authentication support (2FA/TOTP)",
            "API Key verification for every request",
            "API Rate Limiting",
            "Comprehensive Audit Logging",
          ]}
        />
      </>
    ),
  },
  {
    id: "retention",
    titleTh: "ระยะเวลาเก็บรักษาข้อมูล",
    titleEn: "Data Retention",
    contentTh: (
      <>
        <P>เราจัดเก็บข้อมูลตามระยะเวลาดังนี้:</P>
        <List
          items={[
            "ข้อมูลบัญชี — ตลอดระยะเวลาที่ใช้บริการ + 90 วันหลังปิดบัญชี",
            "ประวัติการส่ง SMS — 2 ปี",
            "ข้อมูลการชำระเงิน — 7 ปี (ตามกฎหมายภาษี)",
            "Audit Logs — 3 ปี",
            "ข้อมูล Consent — 10 ปี (ตามข้อกำหนด PDPA)",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>We retain data according to the following periods:</P>
        <List
          items={[
            "Account data — duration of service + 90 days after account closure",
            "SMS sending history — 2 years",
            "Payment data — 7 years (per tax law requirements)",
            "Audit Logs — 3 years",
            "Consent records — 10 years (per PDPA requirements)",
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
        <P>หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว:</P>
        <List
          items={[
            "เจ้าหน้าที่คุ้มครองข้อมูล (DPO): dpo@smsok.com",
            "ฝ่ายสนับสนุน: support@smsok.com",
            "LINE Official: @smsok (จ.-ศ. 9:00-18:00)",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>If you have questions about this privacy policy:</P>
        <List
          items={[
            "Data Protection Officer (DPO): dpo@smsok.com",
            "Support: support@smsok.com",
            "LINE Official: @smsok (Mon-Fri 9:00-18:00)",
          ]}
        />
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      titleTh="นโยบายความเป็นส่วนตัว"
      titleEn="Privacy Policy"
      subtitleTh="นโยบายความเป็นส่วนตัว"
      subtitleEn="Privacy Policy"
      lastUpdated="11 มีนาคม 2026"
      currentPath="/privacy"
      sections={sections}
    />
  );
}
