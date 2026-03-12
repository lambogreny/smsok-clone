import { NextRequest } from "next/server";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  otpQueue,
  singleQueue,
  batchQueue,
  campaignQueue,
  webhookQueue,
  dlqQueue,
} from "@/lib/queue/queues";
import { authenticateAdmin } from "@/lib/admin-auth";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(otpQueue),
    new BullMQAdapter(singleQueue),
    new BullMQAdapter(batchQueue),
    new BullMQAdapter(campaignQueue),
    new BullMQAdapter(webhookQueue),
    new BullMQAdapter(dlqQueue),
  ],
  serverAdapter,
});

const handler = serverAdapter.getRouter();

export async function GET(req: NextRequest) {
  // Auth guard — only SUPER_ADMIN can access BullBoard
  try {
    await authenticateAdmin(req, ["SUPER_ADMIN"]);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Promise<Response>((resolve) => {
    const url = new URL(req.url);
    const mockReq = {
      method: "GET",
      url: url.pathname.replace("/api/admin/queues", "") || "/",
      headers: Object.fromEntries(new Headers(req.headers)),
      query: Object.fromEntries(url.searchParams),
    };
    const mockRes = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: "",
      setHeader(key: string, value: string) {
        this.headers[key] = value;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send(data: string) {
        this.body = data;
        resolve(
          new Response(data, {
            status: this.statusCode,
            headers: this.headers,
          })
        );
      },
      json(data: unknown) {
        this.headers["Content-Type"] = "application/json";
        this.send(JSON.stringify(data));
      },
    };
    handler(mockReq as any, mockRes as any, () => {
      resolve(new Response("Not Found", { status: 404 }));
    });
  });
}
