"use client";

import { useState } from "react";
import {
  Shield, ShieldOff, Loader2, Calendar, AlertTriangle, Info,
} from "lucide-react";
import { updateContactConsent } from "@/lib/actions/contacts";
import { safeErrorMessage } from "@/lib/error-messages";
import { formatThaiDate } from "@/lib/format-thai-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type ConsentData = {
  smsConsent: boolean;
  consentStatus: string;
  consentAt: string | null;
  optOutAt: string | null;
  optOutReason: string | null;
};

export default function ConsentSection({
  contactId,
  initialConsent,
}: {
  contactId: string;
  initialConsent: ConsentData;
}) {
  const [consent, setConsent] = useState(initialConsent);
  const [optOutReason, setOptOutReason] = useState(initialConsent.optOutReason ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (newValue: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateContactConsent(contactId, {
        smsConsent: newValue,
        optOutReason: !newValue ? optOutReason || undefined : undefined,
      });
      setConsent({
        smsConsent: result.smsConsent,
        consentStatus: result.consentStatus,
        consentAt: result.consentAt?.toISOString() ?? null,
        optOutAt: result.optOutAt?.toISOString() ?? null,
        optOutReason: result.optOutReason,
      });
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return formatThaiDate(d);
  };

  return (
    <div className="space-y-4">
      {/* Main Consent Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> การยินยอมรับ SMS (Consent)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-[var(--error)] bg-[rgba(var(--error-rgb,239,68,68),0.1)] rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}

          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              {consent.smsConsent ? (
                <Shield className="w-5 h-5 text-[var(--success)]" />
              ) : (
                <ShieldOff className="w-5 h-5 text-[var(--error)]" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {consent.smsConsent ? "อนุญาตรับ SMS" : "ปฏิเสธรับ SMS"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {consent.smsConsent
                    ? "รายชื่อนี้ยินยอมรับข้อความ SMS"
                    : "รายชื่อนี้ปฏิเสธการรับข้อความ SMS"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Switch
                checked={consent.smsConsent}
                onCheckedChange={handleToggle}
                disabled={saving}
              />
            </div>
          </div>

          {/* Opt-out Reason */}
          {!consent.smsConsent && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                เหตุผลที่ปฏิเสธ
              </label>
              <Input
                value={optOutReason}
                onChange={(e) => setOptOutReason(e.target.value)}
                placeholder="เช่น STOP keyword, ขอยกเลิก, ไม่ต้องการ"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => handleToggle(false)}
              >
                บันทึกเหตุผล
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> ประวัติ Consent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">สถานะปัจจุบัน</span>
              <Badge variant={consent.smsConsent ? "default" : "destructive"}>
                {consent.consentStatus === "OPTED_IN" ? "Opted In" : consent.consentStatus === "OPTED_OUT" ? "Opted Out" : "Pending"}
              </Badge>
            </div>
            {consent.consentAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ยินยอมเมื่อ</span>
                <span className="text-xs">{formatDate(consent.consentAt)}</span>
              </div>
            )}
            {consent.optOutAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ปฏิเสธเมื่อ</span>
                <span className="text-xs">{formatDate(consent.optOutAt)}</span>
              </div>
            )}
            {consent.optOutReason && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">เหตุผล</span>
                <span className="text-xs">{consent.optOutReason}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDPA Info */}
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--accent-secondary)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">PDPA Compliance</p>
            <p className="text-xs text-muted-foreground mt-1">
              ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล ผู้ติดต่อต้องให้ความยินยอมก่อนส่ง SMS
              การเปลี่ยนสถานะจะบันทึกเวลาและเหตุผลเพื่อเป็นหลักฐาน
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
