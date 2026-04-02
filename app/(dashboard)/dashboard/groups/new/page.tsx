"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Users,
  Search,
  Plus,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createGroup, addContactToGroup } from "@/lib/actions/groups";
import { searchContactsBasic } from "@/lib/actions/contacts";
import { safeErrorMessage } from "@/lib/error-messages";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { formatPhone } from "@/lib/format-thai-date";

/* ─── Schema ─── */

const groupSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อกลุ่ม").max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof groupSchema>;

type ContactStub = {
  id: string;
  name: string;
  phone: string;
};

/* ─── Main ─── */

export default function NewGroupPage() {
  const router = useRouter();
  const [selectedContacts, setSelectedContacts] = useState<ContactStub[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ContactStub[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", description: "" },
  });

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const results = await searchContactsBasic(query.trim());
        setSearchResults(
          results.filter(
            (r: ContactStub) => !selectedContacts.some((s) => s.id === r.id)
          )
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [selectedContacts]
  );

  function addContact(contact: ContactStub) {
    setSelectedContacts((prev) => [...prev, contact]);
    setSearchResults((prev) => prev.filter((r) => r.id !== contact.id));
  }

  function removeContact(id: string) {
    setSelectedContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function onSubmit(data: FormValues) {
    setCreating(true);
    try {
      const group = await createGroup(data.name, data.description ?? "");

      // Add selected contacts to group
      for (const contact of selectedContacts) {
        try {
          await addContactToGroup(group.id, contact.id);
        } catch {
          // Some contacts may fail — continue with others
        }
      }

      toast.success(`สร้างกลุ่ม "${data.name}" สำเร็จ`);
      router.push(`/dashboard/groups/${group.id}`);
    } catch (e) {
      toast.error(safeErrorMessage(e) || "เกิดข้อผิดพลาด");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageLayout>
      <PageHeader
        title="สร้างกลุ่มใหม่"
        actions={
          <Link
            href="/dashboard/groups"
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปรายการกลุ่ม
          </Link>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Group Info */}
          <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] p-6">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent)]" />
              ข้อมูลกลุ่ม
            </h2>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      ชื่อกลุ่ม <span className="text-[var(--error)]">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น ลูกค้า VIP, ทีมขาย..."
                        className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      คำอธิบาย
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="อธิบายวัตถุประสงค์ของกลุ่มนี้..."
                        rows={3}
                        className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Add Contacts */}
          <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] p-6">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--accent)]" />
              เพิ่มสมาชิก
              {selectedContacts.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-none text-[11px]"
                >
                  {selectedContacts.length} คน
                </Badge>
              )}
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="ค้นหาเบอร์โทร/ชื่อ..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--accent)]"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--text-muted)]" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div
                className="rounded-lg overflow-hidden mb-4"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {searchResults.slice(0, 10).map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => addContact(contact)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface-hover)] transition-colors border-b border-[var(--border-default)] last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {contact.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">
                        {formatPhone(contact.phone)}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Selected Contacts */}
            {selectedContacts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px]"
                    style={{
                      background: "rgba(var(--accent-rgb), 0.08)",
                      border: "1px solid rgba(var(--accent-rgb), 0.15)",
                    }}
                  >
                    <span className="text-[var(--text-primary)] font-medium">
                      {contact.name}
                    </span>
                    <span className="text-[var(--text-muted)] font-mono text-[11px]">
                      {formatPhone(contact.phone)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--text-muted)] text-center py-4">
                ค้นหาและเลือกผู้ติดต่อที่ต้องการเพิ่มในกลุ่ม (ไม่บังคับ — เพิ่มทีหลังได้)
              </p>
            )}
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/groups">
              <Button
                type="button"
                variant="outline"
                className="border-[var(--border-default)] text-[var(--text-secondary)]"
              >
                ยกเลิก
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={creating || !form.formState.isValid}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  สร้างกลุ่ม
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
