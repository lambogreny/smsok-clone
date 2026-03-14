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
    titleTh: "Cookie คืออะไร",
    titleEn: "What Are Cookies",
    contentTh: (
      <>
        <P>
          Cookie คือไฟล์ข้อมูลขนาดเล็กที่ถูกจัดเก็บไว้ในเบราว์เซอร์ของคุณเมื่อคุณเข้าชมเว็บไซต์
          Cookie ช่วยให้เว็บไซต์จดจำข้อมูลเกี่ยวกับการเข้าชมของคุณ เช่น ภาษาที่เลือกและการตั้งค่าอื่นๆ
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          Cookies are small data files stored in your browser when you visit a website.
          They help websites remember information about your visit, such as your preferred language and other settings.
        </P>
      </>
    ),
  },
  {
    id: "types",
    titleTh: "ประเภท Cookie ที่เราใช้",
    titleEn: "Types of Cookies We Use",
    contentTh: (
      <>
        <P>เราใช้ Cookie ดังต่อไปนี้:</P>
        <List
          items={[
            "Cookie ที่จำเป็น (Essential) — จำเป็นสำหรับการทำงานของเว็บไซต์ เช่น การเข้าสู่ระบบ การรักษาความปลอดภัย",
            "Cookie เพื่อประสิทธิภาพ (Performance) — เก็บข้อมูลเกี่ยวกับวิธีที่คุณใช้เว็บไซต์ เพื่อปรับปรุงประสบการณ์",
            "Cookie เพื่อฟังก์ชันการทำงาน (Functional) — จดจำการตั้งค่าของคุณ เช่น ภาษา ธีม",
            "Cookie เพื่อการวิเคราะห์ (Analytics) — ช่วยเราเข้าใจรูปแบบการใช้งานของผู้เยี่ยมชม",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>We use the following types of cookies:</P>
        <List
          items={[
            "Essential Cookies — Required for website functionality, such as login and security",
            "Performance Cookies — Collect data on how you use the website to improve experience",
            "Functional Cookies — Remember your settings, such as language and theme preferences",
            "Analytics Cookies — Help us understand visitor usage patterns",
          ]}
        />
      </>
    ),
  },
  {
    id: "essential",
    titleTh: "Cookie ที่จำเป็น",
    titleEn: "Essential Cookies",
    contentTh: (
      <>
        <P>
          Cookie เหล่านี้จำเป็นสำหรับการทำงานของเว็บไซต์และไม่สามารถปิดได้ ได้แก่:
        </P>
        <List
          items={[
            "smsok-session — เก็บข้อมูลการเข้าสู่ระบบ (หมดอายุเมื่อปิดเบราว์เซอร์)",
            "smsok-csrf — ป้องกันการโจมตี CSRF (หมดอายุเมื่อปิดเบราว์เซอร์)",
            "smsok-locale — จดจำภาษาที่เลือก (1 ปี)",
            "smsok-cookie-consent — จดจำการยินยอม Cookie (1 ปี)",
            "smsok-policy-version — เวอร์ชันนโยบายที่ยอมรับ (1 ปี)",
          ]}
        />
      </>
    ),
    contentEn: (
      <>
        <P>
          These cookies are required for the website to function and cannot be disabled:
        </P>
        <List
          items={[
            "smsok-session — Stores login session (expires on browser close)",
            "smsok-csrf — CSRF protection token (expires on browser close)",
            "smsok-locale — Remembers language preference (1 year)",
            "smsok-cookie-consent — Remembers cookie consent (1 year)",
            "smsok-policy-version — Accepted policy version (1 year)",
          ]}
        />
      </>
    ),
  },
  {
    id: "manage",
    titleTh: "การจัดการ Cookie",
    titleEn: "Managing Cookies",
    contentTh: (
      <>
        <P>
          คุณสามารถจัดการหรือลบ Cookie ได้ผ่านการตั้งค่าเบราว์เซอร์ของคุณ
          อย่างไรก็ตาม การปิด Cookie ที่จำเป็นอาจทำให้บางฟีเจอร์ของเว็บไซต์ไม่สามารถใช้งานได้
        </P>
        <P>
          คุณสามารถเปลี่ยนแปลงการยินยอม Cookie ได้ตลอดเวลาผ่านแบนเนอร์ Cookie ที่ด้านล่างของหน้า
          หรือที่หน้าตั้งค่า Privacy ในแดชบอร์ด
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          You can manage or delete cookies through your browser settings.
          However, disabling essential cookies may cause some website features to stop working.
        </P>
        <P>
          You can change your cookie consent at any time through the cookie banner at the bottom of the page,
          or in the Privacy settings in your dashboard.
        </P>
      </>
    ),
  },
  {
    id: "contact",
    titleTh: "ติดต่อเรา",
    titleEn: "Contact Us",
    contentTh: (
      <>
        <P>
          หากมีคำถามเกี่ยวกับนโยบาย Cookie กรุณาติดต่อเราที่ support@smsok.com
        </P>
      </>
    ),
    contentEn: (
      <>
        <P>
          If you have questions about our Cookie Policy, please contact us at support@smsok.com
        </P>
      </>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      titleTh="นโยบาย Cookie"
      titleEn="Cookie Policy"
      lastUpdated="14 มีนาคม 2026"
      sections={sections}
    />
  );
}
