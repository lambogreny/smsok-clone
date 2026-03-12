import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import {
  getKBArticles,
  createKBArticle,
  updateKBArticle,
  deleteKBArticle,
} from "@/lib/actions/admin-support";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const { searchParams } = new URL(req.url);
    const options = {
      category: searchParams.get("category") || undefined,
      published: searchParams.get("published")
        ? searchParams.get("published") === "true"
        : undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    };
    const articles = await getKBArticles(options);
    return apiResponse(articles);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const body = await req.json();
    const article = await createKBArticle(body);
    return apiResponse(article, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const body = await req.json();
    const { articleId, ...data } = body;
    if (!articleId) throw new Error("กรุณาระบุ articleId");
    const article = await updateKBArticle(articleId, data);
    return apiResponse({ article });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const body = await req.json();
    const { articleId } = body;
    if (!articleId) throw new Error("กรุณาระบุ articleId");
    await deleteKBArticle(articleId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
