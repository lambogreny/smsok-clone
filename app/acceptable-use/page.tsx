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
    id: "overview",
    titleTh: "ภาพรวม",
    titleEn: "Overview",
    contentTh: (
      <P>
        นโยบายการใช้งานที่ยอมรับได้ (AUP) นี้กำหนดกฎเกณฑ์สำหรับการใช้บริการ SMSOK
        เพื่อให้มั่นใจว่าผู้ใช้ทุกคนสามารถใช้บริการได้อย่างปลอดภัยและเป็นธรรม
        การละเมิด AUP อาจส่งผลให้บัญชีถูกระงับหรือยกเลิก
      </P>
    ),
    contentEn: (
      <P>
        This Acceptable Use Policy (AUP) defines the rules for using SMSOK services
        to ensure a safe and fair experience for all users.
        Violations may result in account suspension or termination.
      </P>
    ),
  },
  {
    id: "prohibited-content",
    titleTh: "เนื้อหาที่ห้ามส่ง",
    titleEn: "Prohibited Content",
    contentTh: (
      <>
        <P>ห้ามส่ง SMS ที่มีเนื้อหาดังต่อไปนี้:</P>
        <List
          items={[
            "สแปมหรือข้อความไม่พึงประสงค์ที่ผู้รับไม่ได้ยินยอม",
            "เนื้อหาหลอกลวง ฉ้อโกง หรือ Phishing",
            "เนื้อหาลามกอนาจารหรือไม่เหมาะสม",
            "เนื้อหาที่ละเมิดกฎหมาย พ.ร.บ.คอมพิวเตอร์ หรือกฎหมายอื่น",
            "เนื้อหาที่เกี่ยวกับการพนันผิดกฎหมาย",
            "เนื้อหาที่สร้างความเกลียดชังหรือเลือกปฏิบัติ",
            "เนื้อหาที่แอบอ้างเป็นบุคคลหรือองค์กรอื่น",
            "เนื้อหาที่ละเมิดลิขสิทธิ์หรือทรัพย์สินทางปัญญา",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>The following content is prohibited in SMS messages:</P>
        <List
          items={[
            "Spam or unsolicited messages without recipient consent",
            "Fraudulent, deceptive, or phishing content",
            "Pornographic or inappropriate content",
            "Content violating the Computer Crime Act or other laws",
            "Illegal gambling content",
            "Hate speech or discriminatory content",
            "Impersonation of individuals or organizations",
            "Copyright or intellectual property infringement",
          ]}
        />
      </>
    ),
  },
  {
    id: "consent-requirements",
    titleTh: "ข้อกำหนดด้านความยินยอม",
    titleEn: "Consent Requirements",
    contentTh: (
      <>
        <P>ตาม PDPA และมาตรฐานอุตสาหกรรม:</P>
        <List
          items={[
            "SMS การตลาด — ต้องได้รับความยินยอมจากผู้รับก่อนส่ง (Opt-in)",
            "ต้องมีช่องทางยกเลิกการรับ SMS (Opt-out) ในทุกข้อความการตลาด",
            "SMS ธุรกรรม (OTP, แจ้งเตือน) — ส่งได้โดยไม่ต้องขอ consent แยก",
            "ห้ามส่ง SMS การตลาดระหว่าง 20:00 - 08:00",
            "ต้องเก็บหลักฐานการยินยอมไว้อย่างน้อย 10 ปี",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>Per PDPA and industry standards:</P>
        <List
          items={[
            "Marketing SMS — requires prior opt-in consent from recipients",
            "Every marketing SMS must include an opt-out mechanism",
            "Transactional SMS (OTP, notifications) — no separate consent required",
            "Marketing SMS prohibited between 20:00 - 08:00",
            "Consent records must be retained for at least 10 years",
          ]}
        />
      </>
    ),
  },
  {
    id: "sender-name",
    titleTh: "การใช้ Sender Name",
    titleEn: "Sender Name Usage",
    contentTh: (
      <>
        <List
          items={[
            "Sender Name ต้องเป็นชื่อธุรกิจจริงหรือแบรนด์ที่จดทะเบียน",
            "ห้ามใช้ Sender Name ที่อาจทำให้เข้าใจผิดว่าเป็นหน่วยงานราชการ",
            "ห้ามใช้ชื่อแบรนด์ของบุคคลอื่นโดยไม่ได้รับอนุญาต",
            "SMSOK ขอสงวนสิทธิ์ในการปฏิเสธหรือเพิกถอน Sender Name ที่ไม่เหมาะสม",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <List
          items={[
            "Sender Names must be legitimate business names or registered brands",
            "Sender Names that impersonate government agencies are prohibited",
            "Unauthorized use of third-party brand names is prohibited",
            "SMSOK reserves the right to reject or revoke inappropriate Sender Names",
          ]}
        />
      </>
    ),
  },
  {
    id: "rate-limits",
    titleTh: "ข้อจำกัดการใช้งาน",
    titleEn: "Rate Limits and Fair Use",
    contentTh: (
      <>
        <List
          items={[
            "API Rate Limit: ตามแพ็กเกจที่สมัคร (ดูรายละเอียดในเอกสาร API)",
            "ห้ามใช้บริการในลักษณะที่ส่งผลกระทบต่อผู้ใช้คนอื่น",
            "ห้ามส่ง SMS ซ้ำไปยังหมายเลขเดียวกันเกิน 5 ครั้ง/ชั่วโมง",
            "ห้ามใช้ระบบอัตโนมัติเพื่อสร้างบัญชีจำนวนมาก",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <List
          items={[
            "API Rate Limit: per package tier (see API documentation)",
            "Usage must not negatively impact other users",
            "Maximum 5 SMS per hour to the same number",
            "Automated mass account creation is prohibited",
          ]}
        />
      </>
    ),
  },
  {
    id: "enforcement",
    titleTh: "การบังคับใช้",
    titleEn: "Enforcement",
    contentTh: (
      <>
        <P>เมื่อตรวจพบการละเมิด AUP จะดำเนินการดังนี้:</P>
        <List
          items={[
            "ครั้งที่ 1: แจ้งเตือนทางอีเมล พร้อมขอให้แก้ไข",
            "ครั้งที่ 2: ระงับบัญชีชั่วคราว 24 ชม.",
            "ครั้งที่ 3: ระงับบัญชีถาวร",
            "กรณีร้ายแรง: ระงับทันทีโดยไม่มีการแจ้งเตือน",
          ]}
        />
        <P>
          SMS ที่เหลือในแพ็กเกจจะไม่สามารถขอคืนได้หากบัญชีถูกระงับเนื่องจากละเมิด AUP
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>Upon detecting AUP violations, we will take the following actions:</P>
        <List
          items={[
            "1st offense: Email warning with request to resolve",
            "2nd offense: Temporary 24-hour account suspension",
            "3rd offense: Permanent account suspension",
            "Severe violations: Immediate suspension without warning",
          ]}
        />
        <P>
          Remaining SMS in suspended accounts due to AUP violations are non-refundable.
        </P>
      </>
    ),
  },
  {
    id: "reporting",
    titleTh: "การรายงาน",
    titleEn: "Reporting Violations",
    contentTh: (
      <P>
        หากพบเห็นการละเมิด AUP สามารถรายงานได้ที่ abuse@smsok.com
        เราจะตรวจสอบทุกรายงานภายใน 24 ชั่วโมง (วันทำการ)
      </P>
    ),
    contentEn: (
      <P>
        To report AUP violations, contact abuse@smsok.com.
        All reports will be reviewed within 24 hours (business days).
      </P>
    ),
  },
];

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout
      titleTh="นโยบายการใช้งานที่ยอมรับได้"
      titleEn="Acceptable Use Policy"
      subtitleTh="นโยบายการใช้งานที่ยอมรับได้"
      subtitleEn="Acceptable Use Policy (AUP)"
      lastUpdated="11 มีนาคม 2026"
      currentPath="/acceptable-use"
      sections={sections}
    />
  );
}
