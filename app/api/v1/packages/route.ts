import { apiResponse, apiError } from "@/lib/api-auth";
import { getPackages } from "@/lib/actions/payments";

export async function GET() {
  try {
    const packages = await getPackages();
    return apiResponse({ packages });
  } catch (error) {
    return apiError(error);
  }
}
