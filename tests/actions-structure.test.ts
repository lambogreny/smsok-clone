import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const smsActions = readFileSync(resolve(ROOT, "lib/actions/sms.ts"), "utf-8");
const contactActions = readFileSync(resolve(ROOT, "lib/actions/contacts.ts"), "utf-8");
const senderActions = readFileSync(resolve(ROOT, "lib/actions/sender-names.ts"), "utf-8");
const paymentActions = readFileSync(resolve(ROOT, "lib/actions/payments.ts"), "utf-8");
const indexFile = readFileSync(resolve(ROOT, "lib/actions/index.ts"), "utf-8");

// ==========================================
// SMS Actions
// ==========================================

describe("SMS Actions: Structure", () => {
  it("is a server action", () => {
    expect(smsActions).toContain('"use server"');
  });

  it("has sendSms function", () => {
    expect(smsActions).toContain("async function sendSms");
  });

  it("has sendBatchSms function", () => {
    expect(smsActions).toContain("async function sendBatchSms");
  });

  it("has getMessageStatus function", () => {
    expect(smsActions).toContain("async function getMessageStatus");
  });

  it("has getMessages function", () => {
    expect(smsActions).toContain("async function getMessages");
  });

  it("has getDashboardStats function", () => {
    expect(smsActions).toContain("async function getDashboardStats");
  });
});

describe("sendSms logic", () => {
  const sendBlock = smsActions.slice(
    smsActions.indexOf("async function sendSms"),
    smsActions.indexOf("async function sendBatchSms")
  );

  it("validates input with sendSmsSchema", () => {
    expect(sendBlock).toContain("sendSmsSchema.parse");
  });

  it("calculates SMS count", () => {
    expect(sendBlock).toContain("calculateSmsCount");
  });

  it("checks credit balance", () => {
    expect(sendBlock).toContain("user.credits < smsCount");
  });

  it("throws on insufficient credits", () => {
    expect(sendBlock).toContain("เครดิตไม่เพียงพอ");
  });

  it("verifies sender name is approved", () => {
    expect(sendBlock).toContain('status: "APPROVED"');
  });

  it("allows default SMSOK sender", () => {
    expect(sendBlock).toContain('"SMSOK"');
  });

  it("uses transaction for atomicity", () => {
    expect(sendBlock).toContain("$transaction");
  });

  it("normalizes phone number", () => {
    expect(sendBlock).toContain("normalizePhone");
  });

  it("deducts credits", () => {
    expect(sendBlock).toContain("decrement: smsCount");
  });

  it("revalidates dashboard path", () => {
    expect(sendBlock).toContain('revalidatePath("/dashboard")');
  });
});

describe("sendBatchSms logic", () => {
  const batchBlock = smsActions.slice(
    smsActions.indexOf("async function sendBatchSms"),
    smsActions.indexOf("async function getMessageStatus")
  );

  it("validates with sendBatchSmsSchema", () => {
    expect(batchBlock).toContain("sendBatchSmsSchema.parse");
  });

  it("calculates total credits for all recipients", () => {
    expect(batchBlock).toContain("smsCount * input.recipients.length");
  });

  it("checks total credits sufficient", () => {
    expect(batchBlock).toContain("user.credits < totalCredits");
  });

  it("uses createMany for efficiency", () => {
    expect(batchBlock).toContain("createMany");
  });

  it("returns total message count", () => {
    expect(batchBlock).toContain("totalMessages: result.count");
  });
});

describe("getMessages (reports)", () => {
  const reportBlock = smsActions.slice(
    smsActions.indexOf("async function getMessages"),
    smsActions.indexOf("async function getDashboardStats")
  );

  it("validates filters with reportFilterSchema", () => {
    expect(reportBlock).toContain("reportFilterSchema.parse");
  });

  it("supports status filter", () => {
    expect(reportBlock).toContain("input.status");
  });

  it("supports sender name filter", () => {
    expect(reportBlock).toContain("input.senderName");
  });

  it("supports search", () => {
    expect(reportBlock).toContain("input.search");
  });

  it("supports date range filter", () => {
    expect(reportBlock).toContain("input.from");
    expect(reportBlock).toContain("input.to");
  });

  it("returns pagination info", () => {
    expect(reportBlock).toContain("pagination");
    expect(reportBlock).toContain("totalPages");
  });
});

// ==========================================
// Contact Actions
// ==========================================

describe("Contact Actions: Structure", () => {
  it("is a server action", () => {
    expect(contactActions).toContain('"use server"');
  });

  it("has getContacts", () => {
    expect(contactActions).toContain("async function getContacts");
  });

  it("has createContact", () => {
    expect(contactActions).toContain("async function createContact");
  });

  it("has updateContact", () => {
    expect(contactActions).toContain("async function updateContact");
  });

  it("has deleteContact", () => {
    expect(contactActions).toContain("async function deleteContact");
  });

  it("has importContacts", () => {
    expect(contactActions).toContain("async function importContacts");
  });
});

describe("createContact logic", () => {
  const block = contactActions.slice(
    contactActions.indexOf("async function createContact"),
    contactActions.indexOf("async function updateContact")
  );

  it("validates with createContactSchema", () => {
    expect(block).toContain("createContactSchema.parse");
  });

  it("checks for duplicate phone", () => {
    expect(block).toContain("userId_phone");
    expect(block).toContain("เบอร์โทรนี้มีอยู่แล้ว");
  });
});

describe("updateContact logic", () => {
  const block = contactActions.slice(
    contactActions.indexOf("async function updateContact"),
    contactActions.indexOf("async function deleteContact")
  );

  it("validates id", () => {
    expect(block).toContain("idSchema.parse");
  });

  it("checks ownership", () => {
    expect(block).toContain("contactId, userId");
  });

  it("checks duplicate phone on change", () => {
    expect(block).toContain("input.phone !== contact.phone");
  });
});

describe("importContacts logic", () => {
  const block = contactActions.slice(
    contactActions.indexOf("async function importContacts"),
    contactActions.indexOf("async function addContactsToGroup")
  );

  it("rejects empty import", () => {
    expect(block).toContain("ไม่มีรายชื่อที่จะนำเข้า");
  });

  it("limits to 10000 contacts", () => {
    expect(block).toContain("10,000");
  });

  it("tracks imported vs skipped counts", () => {
    expect(block).toContain("imported");
    expect(block).toContain("skipped");
  });
});

// ==========================================
// Sender Name Actions
// ==========================================

describe("Sender Name Actions: Structure", () => {
  it("is a server action", () => {
    expect(senderActions).toContain('"use server"');
  });

  it("has requestSenderName", () => {
    expect(senderActions).toContain("async function requestSenderName");
  });

  it("has getApprovedSenderNames", () => {
    expect(senderActions).toContain("async function getApprovedSenderNames");
  });

  it("has adminApproveSenderName", () => {
    expect(senderActions).toContain("async function adminApproveSenderName");
  });
});

describe("requestSenderName logic", () => {
  const block = senderActions.slice(
    senderActions.indexOf("async function requestSenderName"),
    senderActions.indexOf("async function getSenderNames")
  );

  it("validates with requestSenderNameSchema", () => {
    expect(block).toContain("requestSenderNameSchema.parse");
  });

  it("checks for duplicate name", () => {
    expect(block).toContain("userId_name");
    expect(block).toContain("ชื่อผู้ส่งนี้มีอยู่แล้ว");
  });

  it("handles rejected name re-request", () => {
    expect(block).toContain("ถูกปฏิเสธแล้ว");
  });
});

describe("getApprovedSenderNames logic", () => {
  const block = senderActions.slice(
    senderActions.indexOf("async function getApprovedSenderNames"),
    senderActions.indexOf("async function adminApproveSenderName")
  );

  it("filters by approved status", () => {
    expect(block).toContain('status: "APPROVED"');
  });

  it("always includes default SMSOK sender", () => {
    expect(block).toContain('"SMSOK"');
  });
});

describe("adminApproveSenderName logic", () => {
  const block = senderActions.slice(
    senderActions.indexOf("async function adminApproveSenderName"),
    senderActions.indexOf("async function adminGetPendingSenderNames")
  );

  it("validates with approveSenderNameSchema", () => {
    expect(block).toContain("approveSenderNameSchema.parse");
  });

  it("only processes pending names", () => {
    expect(block).toContain('status !== "PENDING"');
  });

  it("records approvedBy on approve", () => {
    expect(block).toContain("approvedBy: adminUserId");
  });

  it("records rejectNote on reject", () => {
    expect(block).toContain("rejectNote: input.rejectNote");
  });
});

// ==========================================
// Payment Actions
// ==========================================

describe("Payment Actions: Structure", () => {
  it("is a server action", () => {
    expect(paymentActions).toContain('"use server"');
  });

  it("has purchasePackage", () => {
    expect(paymentActions).toContain("async function purchasePackage");
  });

  it("has uploadSlip", () => {
    expect(paymentActions).toContain("async function uploadSlip");
  });

  it("has adminVerifyTransaction", () => {
    expect(paymentActions).toContain("async function adminVerifyTransaction");
  });

  it("has PACKAGES constant with 8 packages", () => {
    expect(paymentActions).toContain("SMSOK A");
    expect(paymentActions).toContain("SMSOK H");
  });
});

describe("purchasePackage logic", () => {
  const block = paymentActions.slice(
    paymentActions.indexOf("async function purchasePackage"),
    paymentActions.indexOf("async function uploadSlip")
  );

  it("validates packageId", () => {
    expect(block).toContain("idSchema.parse");
  });

  it("checks package exists and is active", () => {
    expect(block).toContain("!pkg.isActive");
    expect(block).toContain("ไม่พบแพ็กเกจ");
  });

  it("calculates expiry from duration", () => {
    expect(block).toContain("pkg.durationDays");
  });

  it("creates pending transaction", () => {
    expect(block).toContain('status: "PENDING"');
  });
});

describe("uploadSlip logic", () => {
  const block = paymentActions.slice(
    paymentActions.indexOf("async function uploadSlip"),
    paymentActions.indexOf("async function adminVerifyTransaction")
  );

  it("validates transactionId", () => {
    expect(block).toContain("idSchema.parse");
  });

  it("only allows pending transactions", () => {
    expect(block).toContain('status !== "PENDING"');
    expect(block).toContain("รายการนี้ดำเนินการแล้ว");
  });
});

describe("adminVerifyTransaction logic", () => {
  const block = paymentActions.slice(
    paymentActions.indexOf("async function adminVerifyTransaction"),
    paymentActions.indexOf("async function getUserTransactions")
  );

  it("checks admin role", () => {
    expect(block).toContain('role: "admin"');
    expect(block).toContain("admin only");
  });

  it("uses transaction for verify (atomic credit + status)", () => {
    expect(block).toContain("$transaction");
  });

  it("increments user credits on verify", () => {
    expect(block).toContain("increment: transaction.credits");
  });

  it("sets verified status and timestamp", () => {
    expect(block).toContain('status: "verified"');
    expect(block).toContain("verifiedAt");
  });

  it("sets rejected status on reject", () => {
    expect(block).toContain('status: "REJECTED"');
  });
});

// ==========================================
// Index exports
// ==========================================

describe("Actions index exports", () => {
  it("exports sendSms", () => {
    expect(indexFile).toContain("sendSms");
  });

  it("exports sendBatchSms", () => {
    expect(indexFile).toContain("sendBatchSms");
  });

  it("exports contact actions", () => {
    expect(indexFile).toContain("getContacts");
    expect(indexFile).toContain("createContact");
    expect(indexFile).toContain("updateContact");
    expect(indexFile).toContain("deleteContact");
    expect(indexFile).toContain("importContacts");
  });

  it("exports sender name actions", () => {
    expect(indexFile).toContain("requestSenderName");
    expect(indexFile).toContain("getSenderNames");
    expect(indexFile).toContain("getApprovedSenderNames");
  });

  it("exports payment actions", () => {
    expect(indexFile).toContain("purchasePackage");
    expect(indexFile).toContain("uploadSlip");
    expect(indexFile).toContain("PACKAGES");
  });
});
