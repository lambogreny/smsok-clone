import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";

const BANK_ACCOUNTS = [
  {
    bank: "กสิกรไทย (KBANK)",
    accountNumber: process.env.KBANK_ACCOUNT || "xxx-x-xxxxx-x",
    accountName: process.env.BANK_ACCOUNT_NAME || "บจก. เอสเอ็มเอสโอเค",
    logo: "kbank",
  },
  {
    bank: "ไทยพาณิชย์ (SCB)",
    accountNumber: process.env.SCB_ACCOUNT || "xxx-xxxxxx-x",
    accountName: process.env.BANK_ACCOUNT_NAME || "บจก. เอสเอ็มเอสโอเค",
    logo: "scb",
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    return apiResponse({ account: BANK_ACCOUNTS[0] });
  } catch (error) {
    return apiError(error);
  }
}
