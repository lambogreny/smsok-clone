"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, Clock, Settings, Phone, Mail,
  Tag, Users, Shield, ShieldOff, Calendar,
} from "lucide-react";
import { formatThaiDateOnly } from "@/lib/format-thai-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CustomFieldsSection from "./CustomFieldsSection";
import ActivityTimeline from "./ActivityTimeline";
import ConsentSection from "./ConsentSection";

type ContactTag = { id: string; name: string; color: string };
type ContactGroup = { id: string; name: string };
type CustomFieldValue = {
  id: string;
  fieldId: string;
  value: string;
  field: { id: string; name: string; type: string; options: string | null };
};
type CustomField = {
  id: string;
  name: string;
  type: string;
  options: string | null;
  required: boolean;
  createdAt: string;
};

type ContactDetail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string | null;
  smsConsent: boolean;
  consentStatus: string;
  consentAt: string | null;
  optOutAt: string | null;
  optOutReason: string | null;
  createdAt: string;
  groups: ContactGroup[];
  contactTags: ContactTag[];
  customFieldValues: CustomFieldValue[];
};

type Tab = "info" | "timeline" | "settings";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "info", label: "ข้อมูล", icon: User },
  { id: "timeline", label: "ไทม์ไลน์", icon: Clock },
  { id: "settings", label: "การตั้งค่า", icon: Settings },
];

export default function ContactDetailClient({
  contact,
  customFields,
}: {
  contact: ContactDetail;
  customFields: CustomField[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("info");

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" /> กลับ
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{contact.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {contact.phone}
                </span>
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {contact.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Badge variant={contact.smsConsent ? "default" : "destructive"} className="h-7">
          {contact.smsConsent ? (
            <><Shield className="w-3 h-3 mr-1" /> Opted In</>
          ) : (
            <><ShieldOff className="w-3 h-3 mr-1" /> Opted Out</>
          )}
        </Badge>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">กลุ่ม</p>
            <div className="flex flex-wrap gap-1">
              {contact.groups.length > 0 ? (
                contact.groups.map((g) => (
                  <Badge key={g.id} variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" /> {g.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">ไม่มีกลุ่ม</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">แท็ก</p>
            <div className="flex flex-wrap gap-1">
              {contact.contactTags.length > 0 ? (
                contact.contactTags.map((t) => (
                  <Badge
                    key={t.id}
                    className="text-xs"
                    style={{
                      backgroundColor: `${t.color}20`,
                      color: t.color,
                      borderColor: `${t.color}40`,
                    }}
                  >
                    <Tag className="w-3 h-3 mr-1" /> {t.name}
                  </Badge>
                ))
              ) : contact.tags ? (
                contact.tags.split(",").map((t) => (
                  <Badge key={t.trim()} variant="outline" className="text-xs">
                    {t.trim()}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">ไม่มีแท็ก</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">สถานะ Consent</p>
            <p className="text-sm font-medium">
              {contact.consentStatus === "OPTED_IN" ? "อนุญาต" : contact.consentStatus === "OPTED_OUT" ? "ปฏิเสธ" : "รอดำเนินการ"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">สร้างเมื่อ</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatThaiDateOnly(contact.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <CustomFieldsSection
          contactId={contact.id}
          customFields={customFields}
          initialValues={contact.customFieldValues}
        />
      )}

      {activeTab === "timeline" && (
        <ActivityTimeline contactId={contact.id} />
      )}

      {activeTab === "settings" && (
        <ConsentSection
          contactId={contact.id}
          initialConsent={{
            smsConsent: contact.smsConsent,
            consentStatus: contact.consentStatus,
            consentAt: contact.consentAt,
            optOutAt: contact.optOutAt,
            optOutReason: contact.optOutReason,
          }}
        />
      )}
    </div>
  );
}
