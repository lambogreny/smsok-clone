"use client";

import { useState, useCallback } from "react";
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check,
  Loader2, AlertTriangle, X,
} from "lucide-react";
import { parseExcelFile, importContactsFromExcel } from "@/lib/actions/excel-import";
import type { ColumnMapping } from "@/lib/actions/excel-import";
import { safeErrorMessage } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/ui/CustomSelect";

type Step = "upload" | "mapping" | "preview" | "result";

type ImportResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; phone: string; error: string }>;
};

const CONTACT_FIELDS = [
  { value: "", label: "— ข้าม —" },
  { value: "name", label: "ชื่อ (จำเป็น)" },
  { value: "phone", label: "เบอร์โทร (จำเป็น)" },
  { value: "email", label: "อีเมล" },
  { value: "tags", label: "แท็ก" },
];

export default function ImportWizard({
  userId,
  open,
  onOpenChange,
  onComplete,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [updateExisting, setUpdateExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setStep("upload");
    setFileBuffer(null);
    setFileName("");
    setHeaders([]);
    setPreview([]);
    setTotalRows(0);
    setMapping({});
    setUpdateExisting(false);
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const validExts = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError("รองรับเฉพาะไฟล์ .xlsx, .xls, .csv");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseExcelFile(buffer);

      setFileBuffer(buffer);
      setFileName(file.name);
      setHeaders(parsed.headers);
      setPreview(parsed.preview);
      setTotalRows(parsed.totalRows);

      // Auto-detect mapping
      const autoMap: Record<string, string> = {};
      for (const h of parsed.headers) {
        const lower = h.toLowerCase().trim();
        if (lower === "name" || lower === "ชื่อ") autoMap[h] = "name";
        else if (lower === "phone" || lower === "เบอร์โทร" || lower === "tel" || lower === "mobile") autoMap[h] = "phone";
        else if (lower === "email" || lower === "อีเมล") autoMap[h] = "email";
        else if (lower === "tags" || lower === "แท็ก" || lower === "tag") autoMap[h] = "tags";
        else autoMap[h] = "";
      }
      setMapping(autoMap);
      setStep("mapping");
    } catch (err) {
      setError(safeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.createElement("input");
      input.type = "file";
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileSelect({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileSelect]);

  const mappingValid = () => {
    const vals = Object.values(mapping);
    return vals.includes("name") && vals.includes("phone");
  };

  const handleImport = async () => {
    if (!fileBuffer || !mappingValid()) return;

    const columnMapping: ColumnMapping = { name: "", phone: "" };
    for (const [header, field] of Object.entries(mapping)) {
      if (field === "name") columnMapping.name = header;
      else if (field === "phone") columnMapping.phone = header;
      else if (field === "email") columnMapping.email = header;
      else if (field === "tags") columnMapping.tags = header;
    }

    setLoading(true);
    setError(null);
    try {
      const importResult = await importContactsFromExcel(
        userId,
        fileBuffer,
        columnMapping,
        { updateExisting },
      );
      setResult(importResult);
      setStep("result");
    } catch (err) {
      setError(safeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            นำเข้ารายชื่อ {step === "upload" ? "— เลือกไฟล์" : step === "mapping" ? "— จับคู่คอลัมน์" : step === "preview" ? "— ตรวจสอบ" : "— ผลลัพธ์"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-sm text-[var(--error)]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setError(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-[var(--accent)]/50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">ลากไฟล์มาวางที่นี่</p>
                <p className="text-xs text-muted-foreground mb-4">
                  รองรับ .xlsx, .xls, .csv (สูงสุด 10,000 แถว)
                </p>
                <label>
                  <Button variant="outline" size="sm" className="cursor-pointer" tabIndex={-1}>
                    เลือกไฟล์
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                ไฟล์: <span className="text-foreground font-medium">{fileName}</span> ({totalRows} แถว)
              </p>
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  จับคู่คอลัมน์ในไฟล์กับฟิลด์รายชื่อ
                </p>
                {headers.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <span className="text-sm font-medium min-w-[120px] truncate">{header}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <CustomSelect
                        value={mapping[header] || ""}
                        onChange={(v) => setMapping((prev) => ({ ...prev, [header]: v }))}
                        options={CONTACT_FIELDS}
                        placeholder="เลือกฟิลด์"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={updateExisting}
                onCheckedChange={(v) => setUpdateExisting(!!v)}
              />
              <span className="text-sm text-muted-foreground">
                อัปเดตรายชื่อที่มีอยู่แล้ว (เบอร์ซ้ำ)
              </span>
            </div>

            {/* Preview table */}
            {preview.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">ตัวอย่างข้อมูล (5 แถวแรก)</p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((h) => (
                          <TableHead key={h} className="text-xs whitespace-nowrap">
                            {h}
                            {mapping[h] && (
                              <Badge variant="secondary" className="ml-1 text-[10px]">
                                → {mapping[h]}
                              </Badge>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row, i) => (
                        <TableRow key={i}>
                          {headers.map((h) => (
                            <TableCell key={h} className="text-xs whitespace-nowrap">
                              {row[h] || "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--accent)]">{result.created}</p>
                  <p className="text-xs text-muted-foreground">สร้างใหม่</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--accent-secondary)]">{result.updated}</p>
                  <p className="text-xs text-muted-foreground">อัปเดต</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground">ข้าม</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--error)]">{result.errors.length}</p>
                  <p className="text-xs text-muted-foreground">ผิดพลาด</p>
                </CardContent>
              </Card>
            </div>

            {result.errors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">รายการที่ผิดพลาด</p>
                <div className="max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">แถว</TableHead>
                        <TableHead className="text-xs">เบอร์โทร</TableHead>
                        <TableHead className="text-xs">ข้อผิดพลาด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.slice(0, 20).map((err, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{err.row}</TableCell>
                          <TableCell className="text-xs font-mono">{err.phone}</TableCell>
                          <TableCell className="text-xs text-[var(--error)]">{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {result.errors.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      ...และอีก {result.errors.length - 20} รายการ
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => { reset(); setStep("upload"); }}>
                <ArrowLeft className="w-4 h-4" /> เลือกไฟล์ใหม่
              </Button>
              <Button onClick={handleImport} disabled={!mappingValid() || loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> กำลังนำเข้า...</>
                ) : (
                  <><Upload className="w-4 h-4" /> นำเข้า {totalRows} รายชื่อ</>
                )}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => { handleClose(); onComplete(); }}>
              <Check className="w-4 h-4" /> เสร็จสิ้น
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
