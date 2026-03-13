"use client";

import { useState } from "react";
import { Save, Plus, Loader2, Type, Hash, CalendarDays, List, ToggleLeft } from "lucide-react";
import { setCustomFieldValues } from "@/lib/actions/custom-fields";
import { safeErrorMessage } from "@/lib/error-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import CustomSelect from "@/components/ui/CustomSelect";

type CustomField = {
  id: string;
  name: string;
  type: string;
  options: string | null;
  required: boolean;
  createdAt: string;
};

type CustomFieldValue = {
  id: string;
  fieldId: string;
  value: string;
  field: { id: string; name: string; type: string; options: string | null };
};

const FIELD_TYPE_ICONS: Record<string, typeof Type> = {
  text: Type,
  number: Hash,
  date: CalendarDays,
  select: List,
  boolean: ToggleLeft,
};

export default function CustomFieldsSection({
  contactId,
  customFields,
  initialValues,
}: {
  contactId: string;
  customFields: CustomField[];
  initialValues: CustomFieldValue[];
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const v of initialValues) {
      map[v.fieldId] = v.value;
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = Object.entries(values)
        .filter(([, v]) => v !== "")
        .map(([fieldId, value]) => ({ fieldId, value }));
      await setCustomFieldValues(contactId, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setSuccess(false);
  };

  if (customFields.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">ยังไม่มี Custom Fields</p>
          <p className="text-xs text-muted-foreground">
            สร้าง Custom Fields ได้ที่หน้าตั้งค่า เพื่อเก็บข้อมูลเพิ่มเติมของรายชื่อ
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">ข้อมูลเพิ่มเติม (Custom Fields)</CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
          ) : success ? (
            <><Save className="w-4 h-4" /> บันทึกแล้ว</>
          ) : (
            <><Save className="w-4 h-4" /> บันทึก</>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-[var(--error)] bg-[rgba(var(--error-rgb,239,68,68),0.1)] rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customFields.map((field) => {
            const Icon = FIELD_TYPE_ICONS[field.type] || Type;
            const currentValue = values[field.id] ?? "";

            return (
              <div key={field.id} className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  {field.name}
                  {field.required && <Badge variant="destructive" className="text-[10px] px-1 py-0">จำเป็น</Badge>}
                </label>

                {field.type === "text" && (
                  <Input
                    value={currentValue}
                    onChange={(e) => updateValue(field.id, e.target.value)}
                    placeholder={`กรอก ${field.name}`}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    type="number"
                    value={currentValue}
                    onChange={(e) => updateValue(field.id, e.target.value)}
                    placeholder="0"
                  />
                )}

                {field.type === "date" && (
                  <Input
                    type="date"
                    value={currentValue}
                    onChange={(e) => updateValue(field.id, e.target.value)}
                  />
                )}

                {field.type === "select" && (() => {
                  const opts: string[] = field.options ? JSON.parse(field.options) : [];
                  return (
                    <CustomSelect
                      value={currentValue}
                      onChange={(v) => updateValue(field.id, v)}
                      options={opts.map((o) => ({ value: o, label: o }))}
                      placeholder={`เลือก ${field.name}`}
                    />
                  );
                })()}

                {field.type === "boolean" && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={currentValue === "true"}
                      onCheckedChange={(v) => updateValue(field.id, v ? "true" : "false")}
                    />
                    <span className="text-sm text-muted-foreground">
                      {currentValue === "true" ? "ใช่" : "ไม่"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
