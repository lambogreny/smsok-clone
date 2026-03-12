import { apiResponse, apiError } from "@/lib/api-auth";

// Bank account for manual transfers
const BANK_ACCOUNT = {
  bank: "กสิกรไทย (KBANK)",
  accountNumber: process.env.KBANK_ACCOUNT || "xxx-x-xxxxx-x",
  accountName: process.env.BANK_ACCOUNT_NAME || "บจก. เอสเอ็มเอสโอเค",
  logo: "kbank",
};

// GET /api/v1/bank-accounts — frontend expects { account: {...} }
export async function GET() {
  try {
    return apiResponse({ account: BANK_ACCOUNT });
  } catch (error) {
    return apiError(error);
  }
}
