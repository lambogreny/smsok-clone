import { NextRequest } from "next/server";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  otpQueue,
  singleQueue,
  scheduledQueue,
  batchQueue,
  campaignQueue,
  webhookQueue,
  slipVerifyQueue,
  dlqQueue,
} from "@/lib/queue/queues";
import { authenticateAdmin } from "@/lib/admin-auth";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(otpQueue),
    new BullMQAdapter(singleQueue),
    new BullMQAdapter(scheduledQueue),
    new BullMQAdapter(batchQueue),
    new BullMQAdapter(campaignQueue),
    new BullMQAdapter(webhookQueue),
    new BullMQAdapter(slipVerifyQueue),
    new BullMQAdapter(dlqQueue),
  ],
  serverAdapter,
});

const handler = serverAdapter.getRouter();

type AdapterRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
};

type AdapterResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  setHeader: (key: string, value: string) => void;
  status: (code: number) => AdapterResponse;
  send: (data: string) => void;
  json: (data: unknown) => void;
};

type RouterHandler = (req: AdapterRequest, res: AdapterResponse, next: () => void) => void;

export async function GET(req: NextRequest) {
  // Auth guard — only SUPER_ADMIN can access BullBoard
  try {
    await authenticateAdmin(req, ["SUPER_ADMIN"]);
  } catch {
    return new Response(JSON.stringify({ error: "ไม่ได้รับอนุญาต" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Promise<Response>((resolve) => {
    const url = new URL(req.url);
    const adapterReq = {
      method: "GET",
      url: url.pathname.replace("/api/admin/queues", "") || "/",
      headers: Object.fromEntries(new Headers(req.headers)),
      query: Object.fromEntries(url.searchParams),
    };
    const adapterRes = {
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
    (handler as unknown as RouterHandler)(adapterReq, adapterRes, () => {
      resolve(new Response("Not Found", { status: 404 }));
    });
  });
}
