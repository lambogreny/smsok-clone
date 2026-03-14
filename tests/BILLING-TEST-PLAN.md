# Sprint B — Billing & Payment Test Plan

## Test Environment
- Customer App: https://smsok.9phum.me (prod) / http://localhost:3000 (local)
- Backoffice: https://admin.smsok.9phum.me (prod) / http://localhost:3001 (local)
- Test Account: qa-suite@smsok.test / QATest123!

---

## 1. Package Selection

### 1.1 Display
| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| PS-01 | แสดง 8 tiers ครบ (4 SME + 4 Enterprise) | ทุก tier มีชื่อ, จำนวน SMS, ราคา, bonus | P1 |
| PS-02 | ราคาแสดงถูกต้อง (บาท + VAT 7%) | ตรงกับ DB/config | P1 |
| PS-03 | Tab SME/Enterprise สลับได้ | แสดง tiers ตาม category | P1 |
| PS-04 | SMS slider/input เปลี่ยนจำนวนได้ | ราคาอัพเดตตาม tier ที่เหมาะสม | P1 |
| PS-05 | "BEST VALUE" badge แสดงบน Growth tier | Badge visible | P2 |

### 1.2 Responsive
| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| PS-06 | Mobile 375px — cards stack vertically | ไม่มี horizontal overflow | P1 |
| PS-07 | Tablet 768px — 2 columns | Layout ไม่แตก | P1 |
| PS-08 | Desktop 1440px — 4 columns | Full layout | P1 |

### 1.3 Navigation
| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| PS-09 | กดเลือกแพ็คเกจ → checkout | Redirect ไปหน้า checkout + แสดงแพ็คเกจที่เลือก | P1 |
| PS-10 | กด "ซื้อ" → ไม่มี login → redirect login | Auth guard ทำงาน | P1 |

---

## 2. Checkout + Slip Upload

### 2.1 Checkout Page
| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| CO-01 | แสดงราคาแพ็คเกจที่เลือก | ราคาตรง tier | P1 |
| CO-02 | แสดง VAT 7% คำนวณถูก | VAT = ราคา * 0.07 | P1 |
| CO-03 | แสดงราคารวม VAT | Total = ราคา + VAT | P1 |
| CO-04 | QR PromptPay แสดงผลได้ | QR code visible + scannable | P1 |
| CO-05 | Countdown timer แสดง + นับถอยหลัง | Timer ลดลงทุกวินาที | P1 |
| CO-06 | Timer หมด → order expired | แสดง expired status + ปุ่มสั่งใหม่ | P1 |

### 2.2 Slip Upload
| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| SU-01 | Upload JPG slip (< 5MB) | Upload success + preview | P1 |
| SU-02 | Upload PNG slip (< 5MB) | Upload success + preview | P1 |
| SU-03 | Upload PDF file | Error: "รองรับเฉพาะไฟล์รูปภาพ" | P1 |
| SU-04 | Upload .exe file | Error: "ไม่รองรับไฟล์ประเภทนี้" | P1 |
| SU-05 | Upload > 5MB image | Error: "ไฟล์ใหญ่เกินไป" | P1 |
| SU-06 | Upload ไม่เลือกไฟล์ + กดส่ง | Error: "กรุณาแนบสลิป" | P1 |
| SU-07 | Upload สำเร็จ → order status = VERIFYING | Status badge เปลี่ยน | P1 |

### 2.3 Order Status Flow
| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| OS-01 | สร้าง order → status = PENDING | Badge "รอชำระ" | P1 |
| OS-02 | Upload slip → status = VERIFYING | Badge "กำลังตรวจสอบ" | P1 |
| OS-03 | Admin approve → status = PAID | Badge "ชำระแล้ว" + เครดิตเพิ่ม | P1 |
| OS-04 | Admin reject → status = REJECTED | Badge "ปฏิเสธ" + แสดงเหตุผล | P1 |
| OS-05 | Timer expired → status = EXPIRED | Badge "หมดอายุ" | P1 |

---

## 3. Transaction History

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| TH-01 | แสดงรายการ transactions ทั้งหมด | List + pagination | P1 |
| TH-02 | Filter by status (PAID, PENDING, etc.) | แสดงเฉพาะ status ที่เลือก | P1 |
| TH-03 | Filter by date range | แสดงเฉพาะช่วงวันที่ | P1 |
| TH-04 | Pagination (20 per page) | Next/Prev ทำงาน | P1 |
| TH-05 | Download ใบเสร็จ (PDF) | PDF download + เปิดได้ | P2 |
| TH-06 | Empty state (ยังไม่มี transactions) | แสดง "ยังไม่มีรายการ" | P2 |

---

## 4. Credits Balance

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| CB-01 | Dashboard แสดง balance ปัจจุบัน | ตัวเลขตรง DB | P1 |
| CB-02 | ซื้อแพ็คเกจ + approve → balance เพิ่ม | Balance += SMS ของ tier + bonus | P1 |
| CB-03 | ส่ง SMS → balance ลด | Balance -= จำนวน SMS ที่ส่ง | P1 |
| CB-04 | Balance < 10% → low warning | แสดง warning banner | P2 |
| CB-05 | Balance = 0 → ส่ง SMS ไม่ได้ | Error "เครดิตไม่เพียงพอ" + ลิงก์ซื้อ | P1 |
| CB-06 | Quick top-up button → ไปหน้า packages | Redirect ถูก | P2 |

---

## 5. Security Tests

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| SEC-01 | XSS in slip filename | Filename sanitized | P1 |
| SEC-02 | Path traversal in upload | Rejected | P1 |
| SEC-03 | Upload สลิปซ้ำ (duplicate slip) | Error หรือ warning | P1 |
| SEC-04 | แก้ order ID ใน URL (IDOR) | 403 Forbidden | P1 |
| SEC-05 | แก้ราคาใน request body | Server validate ราคาจาก DB | P1 |
| SEC-06 | Order ของ user อื่น | ไม่เห็น / 403 | P1 |

---

## 6. Edge Cases

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| EC-01 | ซื้อซ้ำ 2 orders พร้อมกัน | ทั้ง 2 orders สร้างได้ แยก independent | P1 |
| EC-02 | Upload สลิปที่ใช้แล้ว | Error "สลิปนี้เคยใช้แล้ว" | P1 |
| EC-03 | Order expired → กดซื้อใหม่ | สร้าง order ใหม่ได้ | P1 |
| EC-04 | Network error ระหว่าง upload | แสดง error + ปุ่ม retry | P2 |
| EC-05 | Double-click ปุ่ม upload | ไม่ส่ง 2 ครั้ง (debounce) | P1 |
| EC-06 | Refresh หน้าระหว่าง checkout | State คงอยู่ หรือ redirect กลับ | P2 |
| EC-07 | Back button หลัง payment | ไม่ double charge | P1 |

---

## Test Execution Notes
- **Browser ONLY** — ห้ามใช้ curl/wget
- Screenshot ทุก test case ที่ FAIL
- ใช้ Playwright headless สำหรับ automated tests
- Manual test สำหรับ slip upload (ต้องมีไฟล์จริง)
- Test account credit จะถูกใช้ — อาจต้อง seed credit ก่อน test

## Total: 46 test cases (38 P1 + 8 P2)
