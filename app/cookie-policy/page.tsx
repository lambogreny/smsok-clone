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
    id: "what-are-cookies",
    titleTh: "คุกกี้คืออะไร",
    titleEn: "What Are Cookies",
    contentTh: (
      <>
        <P>
          คุกกี้ (Cookies) คือไฟล์ข้อมูลขนาดเล็กที่ถูกจัดเก็บบนอุปกรณ์ของคุณ
          เมื่อคุณเยี่ยมชมเว็บไซต์ SMSOK คุกกี้ช่วยให้เว็บไซต์จดจำการตั้งค่าของคุณ
          และทำให้ประสบการณ์การใช้งานดีขึ้น
        </P>
        <P>
          นโยบายนี้อธิบายประเภทของคุกกี้ที่เราใช้ วัตถุประสงค์ และวิธีจัดการคุกกี้
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          Cookies are small data files stored on your device when you visit the SMSOK
          website. Cookies help the website remember your preferences and improve your
          browsing experience.
        </P>
        <P>
          This policy explains the types of cookies we use, their purposes, and how to
          manage them in accordance with the Personal Data Protection Act (PDPA).
        </P>
      </>
    ),
  },
  {
    id: "essential",
    titleTh: "คุกกี้ที่จำเป็น (Essential Cookies)",
    titleEn: "Essential Cookies",
    contentTh: (
      <>
        <P>
          คุกกี้เหล่านี้จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์
          ไม่สามารถปิดใช้งานได้ ประกอบด้วย:
        </P>
        <List
          items={[
            "Session Cookie — เก็บสถานะการเข้าสู่ระบบ (JWT Token)",
            "CSRF Token — ป้องกันการโจมตี Cross-Site Request Forgery",
            "Cookie Consent — จดจำการยินยอมคุกกี้ของคุณ",
            "Language Preference — จดจำภาษาที่คุณเลือก (TH/EN)",
          ]}
        />
        <P>
          คุกกี้เหล่านี้ไม่เก็บข้อมูลส่วนบุคคลที่สามารถระบุตัวตนได้โดยตรง
          และหมดอายุเมื่อปิดเบราว์เซอร์หรือตามระยะเวลาที่กำหนด
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          These cookies are essential for the basic functionality of the website
          and cannot be disabled:
        </P>
        <List
          items={[
            "Session Cookie — stores login state (JWT Token)",
            "CSRF Token — protects against Cross-Site Request Forgery attacks",
            "Cookie Consent — remembers your cookie preferences",
            "Language Preference — remembers your language choice (TH/EN)",
          ]}
        />
        <P>
          These cookies do not store directly identifiable personal data and expire
          when you close the browser or after a set duration.
        </P>
      </>
    ),
  },
  {
    id: "analytics",
    titleTh: "คุกกี้วิเคราะห์ (Analytics Cookies)",
    titleEn: "Analytics Cookies",
    contentTh: (
      <>
        <P>
          คุกกี้วิเคราะห์ช่วยให้เราเข้าใจว่าผู้ใช้โต้ตอบกับเว็บไซต์อย่างไร
          เพื่อปรับปรุงประสบการณ์การใช้งาน:
        </P>
        <List
          items={[
            "จำนวนผู้เข้าชมและหน้าที่เข้าชม",
            "ระยะเวลาที่ใช้ในแต่ละหน้า",
            "แหล่งที่มาของการเข้าชม (Traffic Source)",
            "ประเภทอุปกรณ์และเบราว์เซอร์ที่ใช้",
          ]}
        />
        <P>
          ข้อมูลเหล่านี้ถูกรวบรวมในลักษณะไม่ระบุตัวตน (Anonymous)
          คุณสามารถปิดใช้งานคุกกี้ประเภทนี้ได้
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          Analytics cookies help us understand how users interact with our website
          to improve the experience:
        </P>
        <List
          items={[
            "Number of visitors and pages visited",
            "Time spent on each page",
            "Traffic sources",
            "Device types and browsers used",
          ]}
        />
        <P>
          This data is collected anonymously. You can disable these cookies.
        </P>
      </>
    ),
  },
  {
    id: "preferences",
    titleTh: "คุกกี้การตั้งค่า (Preference Cookies)",
    titleEn: "Preference Cookies",
    contentTh: (
      <>
        <P>
          คุกกี้การตั้งค่าจดจำตัวเลือกที่คุณกำหนดเพื่อประสบการณ์ที่เป็นส่วนตัว:
        </P>
        <List
          items={[
            "ธีมการแสดงผล (Light / Dark Mode)",
            "การตั้งค่าหน้า Dashboard (มุมมอง, ตัวกรอง)",
            "การแจ้งเตือนที่ปิดไปแล้ว (Dismissed Alerts)",
            "การตั้งค่าขนาดตัวอักษรและการแสดงผล",
          ]}
        />
        <P>
          คุกกี้เหล่านี้ช่วยให้คุณไม่ต้องตั้งค่าซ้ำทุกครั้งที่เข้าใช้งาน
          คุณสามารถปิดใช้งานได้ แต่ประสบการณ์การใช้งานอาจไม่สมบูรณ์
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          Preference cookies remember your choices for a personalized experience:
        </P>
        <List
          items={[
            "Display theme (Light / Dark Mode)",
            "Dashboard settings (views, filters)",
            "Dismissed alerts and notifications",
            "Font size and display preferences",
          ]}
        />
        <P>
          These cookies prevent you from having to reconfigure settings each visit.
          You can disable them, but your experience may be less personalized.
        </P>
      </>
    ),
  },
  {
    id: "manage",
    titleTh: "วิธีจัดการคุกกี้",
    titleEn: "Managing Cookies",
    contentTh: (
      <>
        <P>คุณสามารถจัดการคุกกี้ได้หลายวิธี:</P>
        <List
          items={[
            "การตั้งค่าเบราว์เซอร์ — ทุกเบราว์เซอร์อนุญาตให้คุณจัดการ ลบ หรือบล็อกคุกกี้ผ่านการตั้งค่า",
            "Cookie Banner — เมื่อเข้าเว็บไซต์ครั้งแรก คุณสามารถเลือกประเภทคุกกี้ที่ยอมรับ",
            "ตั้งค่าบัญชี — Dashboard → ตั้งค่า → ความเป็นส่วนตัว สามารถปรับการยินยอมคุกกี้ได้",
          ]}
        />
        <P>
          <strong style={{ color: "var(--text-primary)" }}>หมายเหตุ:</strong>{" "}
          การปิดคุกกี้ที่จำเป็นอาจทำให้ไม่สามารถเข้าสู่ระบบหรือใช้งานบางฟีเจอร์ได้
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>You can manage cookies in several ways:</P>
        <List
          items={[
            "Browser settings — all browsers allow you to manage, delete, or block cookies via settings",
            "Cookie Banner — when you first visit the website, you can choose which cookie types to accept",
            "Account settings — Dashboard → Settings → Privacy to adjust cookie consent",
          ]}
        />
        <P>
          <strong style={{ color: "var(--text-primary)" }}>Note:</strong>{" "}
          Disabling essential cookies may prevent you from logging in or using certain features.
        </P>
      </>
    ),
  },
  {
    id: "pdpa",
    titleTh: "การปฏิบัติตาม PDPA",
    titleEn: "PDPA Compliance",
    contentTh: (
      <>
        <P>SMSOK ปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) ดังนี้:</P>
        <List
          items={[
            "ขอความยินยอมก่อนใช้คุกกี้ที่ไม่จำเป็น (Analytics, Preferences)",
            "ให้ข้อมูลที่ชัดเจนเกี่ยวกับวัตถุประสงค์ของแต่ละคุกกี้",
            "จัดเก็บบันทึกความยินยอม (Consent Log) ตามที่กฎหมายกำหนด",
            "อนุญาตให้ถอนความยินยอมได้ตลอดเวลา",
            "ไม่ใช้คุกกี้ติดตามข้ามเว็บไซต์ (Third-party Tracking Cookies)",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>SMSOK complies with the Personal Data Protection Act (PDPA) as follows:</P>
        <List
          items={[
            "Request consent before using non-essential cookies (Analytics, Preferences)",
            "Provide clear information about the purpose of each cookie",
            "Maintain consent logs as required by law",
            "Allow withdrawal of consent at any time",
            "No third-party tracking cookies are used",
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
        <P>หากมีคำถามเกี่ยวกับนโยบายคุกกี้:</P>
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
        <P>If you have questions about this cookie policy:</P>
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

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      titleTh="นโยบายคุกกี้"
      titleEn="Cookie Policy"
      subtitleTh="นโยบายคุกกี้"
      subtitleEn="Cookie Policy"
      lastUpdated="12 มีนาคม 2026"
      currentPath="/cookie-policy"
      sections={sections}
    />
  );
}
