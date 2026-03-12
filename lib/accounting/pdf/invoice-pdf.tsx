/**
 * Thai Tax Invoice PDF Template — มาตรา 86/4
 * 8 องค์ประกอบ ใบกำกับภาษี:
 * 1. คำว่า "ใบกำกับภาษี"
 * 2. ชื่อ ที่อยู่ เลขประจำตัวผู้เสียภาษีของผู้ออก
 * 3. ชื่อ ที่อยู่ ของผู้ซื้อ
 * 4. หมายเลขลำดับของใบกำกับภาษี
 * 5. ชื่อ ชนิด ประเภท ปริมาณ สินค้า/บริการ
 * 6. จำนวนเงินค่าสินค้า/บริการ
 * 7. จำนวนภาษีมูลค่าเพิ่ม
 * 8. วัน เดือน ปี ที่ออกใบกำกับภาษี
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Register Thai Font (IBM Plex Sans Thai) ─────────────
Font.register({
  family: "IBMPlexSansThai",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/ibmplexsansthai/v10/m8JNje1VVIzcq1HzJq2AEdo2Tj_qvLqEatYlR8ZKUqcX.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/ibmplexsansthai/v10/m8JQje1VVIzcq1HzJq2AEdo2Tj_qvLqExvcFbehGW74OXw.ttf",
      fontWeight: "bold",
    },
  ],
});

// ── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "IBMPlexSansThai",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 15,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  docSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  docNumber: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right" as const,
    marginBottom: 2,
  },
  docDate: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right" as const,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase" as const,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  infoBox: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#9ca3af",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
  },
  bold: {
    fontWeight: "bold",
  },
  // Table styles
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  colNo: { width: "8%" },
  colDesc: { width: "42%" },
  colQty: { width: "12%", textAlign: "center" as const },
  colUnit: { width: "18%", textAlign: "right" as const },
  colAmount: { width: "20%", textAlign: "right" as const },
  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 3,
    paddingRight: 8,
  },
  summaryLabel: {
    width: 140,
    textAlign: "right" as const,
    paddingRight: 12,
    fontSize: 10,
  },
  summaryValue: {
    width: 100,
    textAlign: "right" as const,
    fontSize: 10,
  },
  summaryTotal: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#2563eb",
  },
  summaryBox: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 8,
  },
  amountInWords: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    fontSize: 10,
  },
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  signatureBox: {
    width: "40%",
    alignItems: "center" as const,
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    marginTop: 40,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  footerNote: {
    position: "absolute" as const,
    bottom: 15,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 7,
    color: "#9ca3af",
  },
});

// ── Types ───────────────────────────────────────────────
export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoicePdfData = {
  // Document info
  invoiceNumber: string;
  type:
    | "TAX_INVOICE"
    | "RECEIPT"
    | "TAX_INVOICE_RECEIPT"
    | "INVOICE"
    | "QUOTATION"
    | "CREDIT_NOTE";
  createdAt: Date;
  dueDate?: Date | null;
  // Seller (company) info
  seller: {
    name: string;
    taxId: string;
    branch?: string;
    address: string;
    phone: string;
    email: string;
  };
  // Buyer info
  buyer: {
    name: string;
    taxId?: string | null;
    branch?: string | null;
    address: string;
    phone?: string;
    email?: string;
  };
  // Items
  items: InvoiceItem[];
  // Amounts
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  whtRate?: number | null;
  whtAmount?: number | null;
  total: number;
  netPayable?: number | null;
  amountInWords: string;
  // Notes
  notes?: string | null;
};

// ── Helpers ─────────────────────────────────────────────
const DOC_TITLE: Record<string, string> = {
  TAX_INVOICE: "ใบกำกับภาษี",
  RECEIPT: "ใบเสร็จรับเงิน",
  TAX_INVOICE_RECEIPT: "ใบเสร็จรับเงิน/ใบกำกับภาษี",
  INVOICE: "ใบแจ้งหนี้",
  QUOTATION: "ใบแจ้งชำระเงิน",
  CREDIT_NOTE: "ใบลดหนี้",
};

const DOC_SUBTITLE: Record<string, string> = {
  TAX_INVOICE: "Tax Invoice",
  RECEIPT: "Receipt",
  TAX_INVOICE_RECEIPT: "Receipt / Tax Invoice",
  INVOICE: "Invoice",
  QUOTATION: "Pre-payment Invoice",
  CREDIT_NOTE: "Credit Note",
};

function formatDate(d: Date): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const buddhistYear = d.getFullYear() + 543;
  return `${day} ${month} ${buddhistYear}`;
}

function formatMoney(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTaxId(id: string): string {
  // Format: X XXXX XXXXX XX X
  if (id.length !== 13) return id;
  return `${id[0]} ${id.slice(1, 5)} ${id.slice(5, 10)} ${id.slice(10, 12)} ${id[12]}`;
}

// ── Main Component ──────────────────────────────────────
export function InvoicePdf({ data }: { data: InvoicePdfData }) {
  const payableAmount = data.netPayable ?? data.total;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header: Document Title + Number ── */}
        <View style={s.header}>
          <View>
            <Text style={s.docTitle}>{DOC_TITLE[data.type]}</Text>
            <Text style={s.docSubtitle}>{DOC_SUBTITLE[data.type]}</Text>
          </View>
          <View>
            <Text style={s.docNumber}>เลขที่ {data.invoiceNumber}</Text>
            <Text style={s.docDate}>วันที่ {formatDate(data.createdAt)}</Text>
            {data.dueDate && (
              <Text style={s.docDate}>ครบกำหนด {formatDate(data.dueDate)}</Text>
            )}
          </View>
        </View>

        {/* ── Seller & Buyer Info ── */}
        <View style={[s.section, s.infoRow]}>
          <View style={s.infoBox}>
            <Text style={s.sectionTitle}>ผู้ออกเอกสาร (Seller)</Text>
            <Text style={[s.infoValue, s.bold]}>{data.seller.name}</Text>
            <Text style={s.infoValue}>{data.seller.address}</Text>
            <Text style={s.infoValue}>โทร {data.seller.phone}</Text>
            <Text style={[s.infoLabel, { marginTop: 4 }]}>
              เลขประจำตัวผู้เสียภาษี
            </Text>
            <Text style={[s.infoValue, s.bold]}>
              {formatTaxId(data.seller.taxId)}
            </Text>
            {data.seller.branch && (
              <Text style={s.infoValue}>สาขา {data.seller.branch}</Text>
            )}
          </View>

          <View style={s.infoBox}>
            <Text style={s.sectionTitle}>ผู้ซื้อ (Buyer)</Text>
            <Text style={[s.infoValue, s.bold]}>{data.buyer.name}</Text>
            <Text style={s.infoValue}>{data.buyer.address}</Text>
            {data.buyer.phone && (
              <Text style={s.infoValue}>โทร {data.buyer.phone}</Text>
            )}
            {data.buyer.taxId && (
              <>
                <Text style={[s.infoLabel, { marginTop: 4 }]}>
                  เลขประจำตัวผู้เสียภาษี
                </Text>
                <Text style={[s.infoValue, s.bold]}>
                  {formatTaxId(data.buyer.taxId)}
                </Text>
              </>
            )}
            {data.buyer.branch && (
              <Text style={s.infoValue}>สาขา {data.buyer.branch}</Text>
            )}
          </View>
        </View>

        {/* ── Items Table ── */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.colNo}>ลำดับ</Text>
            <Text style={s.colDesc}>รายการ</Text>
            <Text style={s.colQty}>จำนวน</Text>
            <Text style={s.colUnit}>ราคาต่อหน่วย</Text>
            <Text style={s.colAmount}>จำนวนเงิน</Text>
          </View>
          {data.items.map((item, i) => (
            <View
              key={i}
              style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <Text style={s.colNo}>{i + 1}</Text>
              <Text style={s.colDesc}>{item.description}</Text>
              <Text style={s.colQty}>{item.quantity.toLocaleString()}</Text>
              <Text style={s.colUnit}>{formatMoney(item.unitPrice)}</Text>
              <Text style={s.colAmount}>{formatMoney(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* ── Summary ── */}
        <View style={s.summaryBox}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>ราคาก่อนภาษี (Subtotal)</Text>
            <Text style={s.summaryValue}>{formatMoney(data.subtotal)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>
              ภาษีมูลค่าเพิ่ม {data.vatRate}% (VAT)
            </Text>
            <Text style={s.summaryValue}>{formatMoney(data.vatAmount)}</Text>
          </View>
          {data.whtRate != null && data.whtAmount != null && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>
                หัก ณ ที่จ่าย {data.whtRate}% (WHT)
              </Text>
              <Text style={s.summaryValue}>
                -{formatMoney(data.whtAmount)}
              </Text>
            </View>
          )}
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>รวมทั้งสิ้น (Total)</Text>
            <Text style={s.summaryValue}>{formatMoney(data.total)}</Text>
          </View>
          {data.netPayable != null && (
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, s.summaryTotal]}>
                ยอดชำระสุทธิ (Net Payable)
              </Text>
              <Text style={[s.summaryValue, s.summaryTotal]}>
                {formatMoney(data.netPayable)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Amount in Thai Text ── */}
        <View style={s.amountInWords}>
          <Text>
            <Text style={s.bold}>จำนวนเงินตัวอักษร: </Text>
            ({data.amountInWords})
          </Text>
        </View>

        {/* ── Notes ── */}
        {data.notes && (
          <View style={[s.section, { marginTop: 10 }]}>
            <Text style={s.sectionTitle}>หมายเหตุ</Text>
            <Text style={s.infoValue}>{data.notes}</Text>
          </View>
        )}

        {/* ── Signature Lines ── */}
        <View style={s.footer}>
          <View style={s.signatureBox}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>ผู้รับเงิน / Authorized</Text>
          </View>
          <View style={s.signatureBox}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>ผู้ชำระเงิน / Customer</Text>
          </View>
        </View>

        {/* ── Footer Note ── */}
        <Text style={s.footerNote}>
          เอกสารนี้ออกโดยระบบอัตโนมัติ • This document is system-generated
        </Text>
      </Page>
    </Document>
  );
}
