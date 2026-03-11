"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, KeyRound, CreditCard, Loader2,
  ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import { getContactActivity } from "@/lib/actions/activity";
import type { ActivityItem } from "@/lib/actions/activity";
import { safeErrorMessage } from "@/lib/error-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG: Record<string, { icon: typeof MessageSquare; label: string; color: string }> = {
  sms: { icon: MessageSquare, label: "SMS", color: "var(--accent)" },
  otp: { icon: KeyRound, label: "OTP", color: "var(--accent-secondary)" },
  credit: { icon: CreditCard, label: "เครดิต", color: "var(--accent-warm)" },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "sms", label: "SMS" },
  { value: "otp", label: "OTP" },
  { value: "credit", label: "เครดิต" },
];

export default function ActivityTimeline({
  userId,
  contactId,
}: {
  userId: string;
  contactId: string;
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getContactActivity(userId, contactId, {
        page,
        limit: 20,
        type: typeFilter || undefined,
      });
      setActivities(result.activities);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId, contactId, page, typeFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilterChange = (filter: string) => {
    setTypeFilter(filter);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          ไทม์ไลน์กิจกรรม
          {!loading && <Badge variant="secondary" className="text-xs">{total} รายการ</Badge>}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={typeFilter === f.value ? "default" : "ghost"}
              size="sm"
              className="text-xs h-7"
              onClick={() => handleFilterChange(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--error)]">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchActivities}>
              ลองใหม่
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">ยังไม่มีกิจกรรม</p>
            <p className="text-xs text-muted-foreground">
              กิจกรรมจะปรากฏเมื่อมีการส่ง SMS, OTP หรือธุรกรรมเครดิต
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, i) => {
              const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.sms;
              const Icon = config.icon;
              const data = activity.data;
              const isLast = i === activities.length - 1;

              return (
                <div key={activity.id} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.color}15`, color: config.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-border my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: `${config.color}40`, color: config.color }}
                        >
                          {config.label}
                        </Badge>
                        {activity.type === "sms" && typeof data.status === "string" && (
                          <Badge
                            variant={data.status === "DELIVERED" ? "default" : data.status === "FAILED" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {data.status}
                          </Badge>
                        )}
                        {activity.type === "otp" && (
                          <Badge
                            variant={data.verified ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {data.verified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString("th-TH", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.type === "sms" && (
                        <>
                          {String(data.messageType) === "MARKETING" ? "การตลาด" : String(data.messageType) === "OTP" ? "OTP" : "ข้อความ"}
                          {data.senderName ? ` — จาก ${String(data.senderName)}` : ""}
                          {data.creditCost != null ? ` (${String(data.creditCost)} เครดิต)` : ""}
                        </>
                      )}
                      {activity.type === "otp" && (
                        <>{data.purpose ? String(data.purpose) : "OTP Request"}</>
                      )}
                      {activity.type === "credit" && (
                        <>
                          {String(data.transactionType) === "DEBIT" ? "-" : "+"}
                          ฿{String(data.amount)}
                          {data.description ? ` — ${String(data.description)}` : ""}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              หน้า {page} จาก {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
