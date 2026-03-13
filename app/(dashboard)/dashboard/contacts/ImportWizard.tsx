"use client";

import { useState, useCallback } from "react";
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check,
  Loader2, AlertTriangle, X, CheckCircle, XCircle, SkipForward,
} from "lucide-react";
import { parseExcelFile, importContactsFromExcel } from "@/lib/actions/excel-import";
import type { ColumnMapping } from "@/lib/actions/excel-import";
import { safeErrorMessage } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/ui/CustomSelect";

type Step = "upload" | "mapping" | "preview" | "importing" | "result";

type DuplicateAction = "skip" | "update" | "overwrite";

type ImportResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; phone: string; error: string }>;
};

type ValidationSummary = {
  validRows: number;
  invalidRows: number;
  duplicatePhones: number;
  missingName: number;
  missingPhone: number;
  invalidPhone: number;
  sampleErrors: Array<{ row: number; field: string; error: string }>;
};

const CONTACT_FIELDS = [
  { value: "", label: "— ข้าม —" },
  { value: "name", label: "ชื่อ (จำเป็น)" },
  { value: "phone", label: "เบอร์โทร (จำเป็น)" },
  { value: "email", label: "อีเมล" },
  { value: "tags", label: "แท็ก" },
];

const DUPLICATE_OPTIONS: { value: DuplicateAction; label: string; desc: string }[] = [
  { value: "skip", label: "ข้าม", desc: "ไม่ทำอะไรกับเบอร์ซ้ำ" },
  { value: "update", label: "ผสานข้อมูล", desc: "อัปเดตเฉพาะฟิลด์ที่มีค่าใหม่" },
  { value: "overwrite", label: "เขียนทับ", desc: "แทนที่ข้อมูลเดิมทั้งหมด" },
];

const PHONE_REGEX = /^(0[0-9]{8,9}|\+66[0-9]{8,9}|66[0-9]{8,9})$/;

export default function ImportWizard({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>("skip");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const reset = () => {
    setStep("upload");
    setFileBuffer(null);
    setFileName("");
    setHeaders([]);
    setPreview([]);
    setAllRows([]);
    setTotalRows(0);
    setMapping({});
    setDuplicateAction("skip");
    setError(null);
    setResult(null);
    setValidation(null);
    setImportProgress(0);
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
      setAllRows(parsed.allRows ?? parsed.preview);
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

  // Validate data before import
  const runValidation = () => {
    const nameHeader = Object.entries(mapping).find(([, v]) => v === "name")?.[0];
    const phoneHeader = Object.entries(mapping).find(([, v]) => v === "phone")?.[0];

    const rows = allRows.length > 0 ? allRows : preview;
    let validRows = 0;
    let invalidRows = 0;
    let missingName = 0;
    let missingPhone = 0;
    let invalidPhone = 0;
    const seenPhones = new Set<string>();
    let duplicatePhones = 0;
    const sampleErrors: ValidationSummary["sampleErrors"] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let hasError = false;

      const name = nameHeader ? (row[nameHeader] || "").trim() : "";
      const phone = phoneHeader ? (row[phoneHeader] || "").trim() : "";

      if (!name) {
        missingName++;
        hasError = true;
        if (sampleErrors.length < 5) sampleErrors.push({ row: i + 2, field: "ชื่อ", error: "ไม่มีชื่อ" });
      }
      if (!phone) {
        missingPhone++;
        hasError = true;
        if (sampleErrors.length < 5) sampleErrors.push({ row: i + 2, field: "เบอร์โทร", error: "ไม่มีเบอร์โทร" });
      } else if (!PHONE_REGEX.test(phone.replace(/[-\s]/g, ""))) {
        invalidPhone++;
        hasError = true;
        if (sampleErrors.length < 5) sampleErrors.push({ row: i + 2, field: "เบอร์โทร", error: `เบอร์ไม่ถูกต้อง: ${phone}` });
      } else {
        const normalized = phone.replace(/[-\s]/g, "");
        if (seenPhones.has(normalized)) {
          duplicatePhones++;
          hasError = true;
          if (sampleErrors.length < 5) sampleErrors.push({ row: i + 2, field: "เบอร์โทร", error: `เบอร์ซ้ำในไฟล์: ${phone}` });
        }
        seenPhones.add(normalized);
      }

      if (hasError) invalidRows++;
      else validRows++;
    }

    setValidation({ validRows, invalidRows, duplicatePhones, missingName, missingPhone, invalidPhone, sampleErrors });
    setStep("preview");
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

    setStep("importing");
    setImportProgress(0);
    setError(null);

    // Simulate progress during import
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const importResult = await importContactsFromExcel(
        fileBuffer,
        columnMapping,
        { updateExisting: duplicateAction !== "skip" },
      );
      clearInterval(progressInterval);
      setImportProgress(100);
      setResult(importResult);
      setTimeout(() => setStep("result"), 300);
    } catch (err) {
      clearInterval(progressInterval);
      setError(safeErrorMessage(err));
      setStep("preview");
    }
  };

  const progressPercent = Math.min(Math.round(importProgress), 100);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            นำเข้ารายชื่อ {step === "upload" ? "— เลือกไฟล์" : step === "mapping" ? "— จับคู่คอลัมน์" : step === "preview" ? "— ตรวจสอบข้อมูล" : step === "importing" ? "— กำลังนำเข้า" : "— ผลลัพธ์"}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-2">
          {(["upload", "mapping", "preview", "result"] as const).map((s, i) => {
            const labels = ["เลือกไฟล์", "จับคู่", "ตรวจสอบ", "ผลลัพธ์"];
            const stepOrder = ["upload", "mapping", "preview", "result"];
            const currentIdx = stepOrder.indexOf(step === "importing" ? "preview" : step);
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isDone ? "bg-[var(--accent)] text-[var(--bg-base)]" :
                  isCurrent ? "bg-[var(--accent)] text-[var(--bg-base)]" :
                  "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-[11px] hidden sm:block ${isCurrent ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]"}`}>
                  {labels[i]}
                </span>
                {i < 3 && <div className={`flex-1 h-px mx-1 ${isDone ? "bg-[var(--accent)]" : "bg-[var(--border-default)]"}`} />}
              </div>
            );
          })}
        </div>

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

            {/* Duplicate Handling */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
                  เมื่อเจอเบอร์ซ้ำ
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DUPLICATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuplicateAction(opt.value)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        duplicateAction === opt.value
                          ? "border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.06)]"
                          : "border-[var(--border-default)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      <p className={`text-sm font-medium ${duplicateAction === opt.value ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

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

        {/* Step 3: Validation Summary */}
        {step === "preview" && validation && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-5 h-5 text-[var(--success)] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--success)]">{validation.validRows}</p>
                  <p className="text-xs text-muted-foreground">พร้อมนำเข้า</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="w-5 h-5 text-[var(--error)] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--error)]">{validation.invalidRows}</p>
                  <p className="text-xs text-muted-foreground">ข้อมูลไม่ถูกต้อง</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <SkipForward className="w-5 h-5 text-[var(--warning)] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--warning)]">{validation.duplicatePhones}</p>
                  <p className="text-xs text-muted-foreground">เบอร์ซ้ำในไฟล์</p>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown */}
            {(validation.missingName > 0 || validation.missingPhone > 0 || validation.invalidPhone > 0) && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">รายละเอียดข้อผิดพลาด</p>
                  {validation.missingName > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">ไม่มีชื่อ</span>
                      <span className="text-[var(--error)] font-medium">{validation.missingName} แถว</span>
                    </div>
                  )}
                  {validation.missingPhone > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">ไม่มีเบอร์โทร</span>
                      <span className="text-[var(--error)] font-medium">{validation.missingPhone} แถว</span>
                    </div>
                  )}
                  {validation.invalidPhone > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">เบอร์ไม่ถูกต้อง</span>
                      <span className="text-[var(--error)] font-medium">{validation.invalidPhone} แถว</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sample Errors */}
            {validation.sampleErrors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">ตัวอย่างข้อผิดพลาด</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">แถว</TableHead>
                      <TableHead className="text-xs">ฟิลด์</TableHead>
                      <TableHead className="text-xs">ข้อผิดพลาด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.sampleErrors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{err.row}</TableCell>
                        <TableCell className="text-xs font-medium">{err.field}</TableCell>
                        <TableCell className="text-xs text-[var(--error)]">{err.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {validation.validRows === 0 && (
              <p className="text-sm text-center text-[var(--error)] py-2">
                ไม่มีข้อมูลที่ถูกต้องสำหรับนำเข้า กรุณาตรวจสอบไฟล์อีกครั้ง
              </p>
            )}
          </div>
        )}

        {/* Step 3.5: Importing (Progress) */}
        {step === "importing" && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)] mx-auto mb-3" />
              <p className="text-sm font-medium">กำลังนำเข้ารายชื่อ...</p>
              <p className="text-xs text-muted-foreground mt-1">{totalRows} รายการ</p>
            </div>
            <div className="max-w-sm mx-auto">
              <div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-1.5">{progressPercent}%</p>
            </div>
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
              <Button onClick={runValidation} disabled={!mappingValid() || loading}>
                ตรวจสอบข้อมูล <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="w-4 h-4" /> กลับ
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validation || validation.validRows === 0}
              >
                <Upload className="w-4 h-4" /> นำเข้า {validation?.validRows ?? 0} รายชื่อ
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
