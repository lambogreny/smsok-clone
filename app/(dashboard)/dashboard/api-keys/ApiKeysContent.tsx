"use client";

import { useState } from "react";
import { Key, Plus, Copy, Check, Trash2, Power, PowerOff, BookOpen, ShieldCheck, AlertTriangle } from "lucide-react";
import { createApiKey, toggleApiKey, deleteApiKey } from "@/lib/actions/api-keys";
import { safeErrorMessage } from "@/lib/error-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
};

const PERMISSIONS = [
  { id: "send_sms", label: "ส่ง SMS", description: "POST /api/v1/sms/send" },
  { id: "read_contacts", label: "อ่านรายชื่อ", description: "GET /api/v1/contacts" },
  { id: "manage_contacts", label: "จัดการรายชื่อ", description: "POST/PUT/DELETE contacts" },
  { id: "manage_groups", label: "จัดการกลุ่ม", description: "CRUD groups" },
  { id: "read_analytics", label: "ดูสถิติ", description: "GET analytics/stats" },
  { id: "manage_templates", label: "จัดการ template", description: "CRUD templates" },
];

function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

export default function ApiKeysContent({ userId, apiKeys: initialKeys }: { userId: string; apiKeys: ApiKey[] }) {
  const [apiKeys, setApiKeys] = useState(initialKeys);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["send_sms", "read_contacts"]);
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [secretConfirmed, setSecretConfirmed] = useState(false);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const newKey = await createApiKey(userId, { name: keyName });
      setApiKeys((prev) => [
        { ...newKey, isActive: true, lastUsed: null, createdAt: new Date().toISOString() } as ApiKey,
        ...prev,
      ]);
      setNewlyCreatedKey(newKey.key);
      setKeyName("");
      setSelectedPermissions(["send_sms", "read_contacts"]);
      setShowCreateDialog(false);
      setSecretConfirmed(false);
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (keyId: string) => {
    try {
      const updated = await toggleApiKey(userId, keyId);
      setApiKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: updated.isActive } : k)));
    } catch (e) {
      setError(safeErrorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApiKey(userId, deleteTarget);
      setApiKeys((prev) => prev.filter((k) => k.id !== deleteTarget));
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCopy = async (text: string, type: "secret" | "id") => {
    await navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-warm)]/10 border border-[var(--accent-warm)]/15 flex items-center justify-center">
            <Key className="w-5 h-5 text-[var(--accent-warm)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold">API Keys</h1>
            <p className="text-sm text-muted-foreground">จัดการ API keys สำหรับเชื่อมต่อระบบภายนอก</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4" /> สร้างคีย์ใหม่
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-[var(--error)]/20">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--error)]" />
            <p className="text-sm text-[var(--error)]">{error}</p>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>ปิด</Button>
          </CardContent>
        </Card>
      )}

      {/* Newly Created Key - ONE TIME SECRET */}
      {newlyCreatedKey && (
        <Card className="border-[var(--success)]/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[var(--success)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--success)]">API Key สร้างเรียบร้อยแล้ว</p>
                <p className="text-xs text-muted-foreground mt-1">คัดลอก Secret Key ตอนนี้เลย — จะไม่แสดงอีกหลังจากปิด</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Secret Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[var(--bg-base)] border border-border rounded-lg px-4 py-2.5 text-sm text-[var(--accent)] font-mono break-all">
                  {newlyCreatedKey}
                </code>
                <Button variant="outline" size="sm" onClick={() => handleCopy(newlyCreatedKey, "secret")}>
                  {copiedSecret ? <><Check className="w-4 h-4" /> คัดลอกแล้ว</> : <><Copy className="w-4 h-4" /> คัดลอก</>}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={secretConfirmed}
                onCheckedChange={(v) => setSecretConfirmed(!!v)}
              />
              <span className="text-xs text-muted-foreground">ฉันคัดลอก Secret Key แล้ว</span>
            </div>

            <Button
              variant="outline"
              disabled={!secretConfirmed}
              onClick={() => setNewlyCreatedKey(null)}
            >
              ปิด
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys Table */}
      <Card>
        <CardContent className="p-0">
          {apiKeys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="hidden md:table-cell">สร้างเมื่อ</TableHead>
                  <TableHead className="hidden md:table-cell">ใช้ล่าสุด</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-semibold">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs text-[var(--accent)] font-mono bg-[var(--bg-base)] px-2 py-1 rounded">
                          {maskKey(key.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(key.key, "id")}
                        >
                          {copiedId === key.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.isActive ? "default" : "destructive"}>
                        {key.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(key.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString("th-TH") : "ยังไม่เคยใช้"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(key.id)}>
                          {key.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(key.id)}>
                          <Trash2 className="w-4 h-4 text-[var(--error)]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">ยังไม่มีคีย์ API</p>
              <p className="text-xs text-muted-foreground mb-4">สร้างคีย์ API เพื่อเชื่อมต่อระบบของคุณ</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4" /> สร้างคีย์ใหม่
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Docs Quick Link */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-[var(--accent-secondary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">API Documentation</p>
            <p className="text-xs text-muted-foreground">เรียนรู้การใช้งาน API สำหรับนักพัฒนา</p>
          </div>
          <a href="/dashboard/api-docs">
            <Button variant="outline" size="sm">ดูเอกสาร</Button>
          </a>
        </CardContent>
      </Card>

      {/* API Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ตัวอย่างการใช้งาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[var(--bg-base)] border border-border rounded-lg p-4">
            <code className="text-xs text-[var(--accent)] font-mono block whitespace-pre">{`curl -X POST https://api.smsok.com/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "0812345678", "message": "Hello!"}'`}</code>
          </div>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4" /> สร้าง API Key ใหม่
            </DialogTitle>
            <DialogDescription>
              กำหนดชื่อและสิทธิ์การใช้งานสำหรับ API Key
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
                ชื่อ Key
              </label>
              <Input
                placeholder="เช่น Production, Staging, My App"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">
                สิทธิ์การใช้งาน
              </label>
              <div className="space-y-2">
                {PERMISSIONS.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                    <Checkbox
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleCreate} disabled={!keyName.trim() || creating}>
              {creating ? "กำลังสร้าง..." : "สร้าง Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ต้องการลบคีย์ API นี้?</AlertDialogTitle>
            <AlertDialogDescription>
              ระบบที่ใช้คีย์นี้จะไม่สามารถเชื่อมต่อได้อีก การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[var(--error)] hover:bg-[var(--error)]/90">
              ยืนยันลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
