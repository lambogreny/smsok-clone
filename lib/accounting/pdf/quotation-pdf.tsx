/**
 * Quotation PDF Template — ใบเสนอราคา
 * Similar structure to Invoice but with quotation-specific fields
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

const s = StyleSheet.create({
  page: { fontFamily: "IBMPlexSansThai", fontSize: 10, padding: 40, color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#059669", paddingBottom: 15 },
  docTitle: { fontSize: 18, fontWeight: "bold", color: "#059669", marginBottom: 4 },
  docSubtitle: { fontSize: 12, color: "#6b7280" },
  docNumber: { fontSize: 11, fontWeight: "bold", textAlign: "right" as const, marginBottom: 2 },
  docDate: { fontSize: 10, color: "#6b7280", textAlign: "right" as const },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 9, fontWeight: "bold", color: "#6b7280", marginBottom: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 20 },
  infoBox: { flex: 1, padding: 10, backgroundColor: "#f0fdf4", borderRadius: 4 },
  infoValue: { fontSize: 10 },
  bold: { fontWeight: "bold" },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: "row", backgroundColor: "#059669", color: "#ffffff", fontWeight: "bold", fontSize: 9, paddingVertical: 6, paddingHorizontal: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", fontSize: 9 },
  tableRowAlt: { backgroundColor: "#f9fafb" },
  colNo: { width: "8%" },
  colDesc: { width: "42%" },
  colQty: { width: "12%", textAlign: "center" as const },
  colUnit: { width: "18%", textAlign: "right" as const },
  colAmount: { width: "20%", textAlign: "right" as const },
  summaryRow: { flexDirection: "row", justifyContent: "flex-end", paddingVertical: 3, paddingRight: 8 },
  summaryLabel: { width: 140, textAlign: "right" as const, paddingRight: 12, fontSize: 10 },
  summaryValue: { width: 100, textAlign: "right" as const, fontSize: 10 },
  summaryTotal: { fontWeight: "bold", fontSize: 12, color: "#059669" },
  summaryBox: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#d1d5db", paddingTop: 8 },
  validityBox: { marginTop: 10, padding: 8, backgroundColor: "#fef3c7", borderRadius: 4, fontSize: 10 },
  footer: { position: "absolute" as const, bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 10 },
  signatureBox: { width: "40%", alignItems: "center" as const },
  signatureLine: { width: 150, borderBottomWidth: 1, borderBottomColor: "#9ca3af", marginTop: 40, marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: "#6b7280" },
  footerNote: { position: "absolute" as const, bottom: 15, left: 40, right: 40, textAlign: "center" as const, fontSize: 7, color: "#9ca3af" },
});

export type QuotationItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type QuotationPdfData = {
  quotationNumber: string;
  createdAt: Date;
  validUntil: Date;
  seller: { name: string; taxId: string; address: string; phone: string };
  buyer: { name: string; address: string; phone?: string; email?: string };
  items: QuotationItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  amountInWords: string;
  notes?: string | null;
};

function formatDate(d: Date): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatMoney(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function QuotationPdf({ data }: { data: QuotationPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.docTitle}>ใบเสนอราคา</Text>
            <Text style={s.docSubtitle}>Quotation</Text>
          </View>
          <View>
            <Text style={s.docNumber}>เลขที่ {data.quotationNumber}</Text>
            <Text style={s.docDate}>วันที่ {formatDate(data.createdAt)}</Text>
          </View>
        </View>

        <View style={[s.section, s.infoRow]}>
          <View style={s.infoBox}>
            <Text style={s.sectionTitle}>ผู้เสนอราคา</Text>
            <Text style={[s.infoValue, s.bold]}>{data.seller.name}</Text>
            <Text style={s.infoValue}>{data.seller.address}</Text>
            <Text style={s.infoValue}>โทร {data.seller.phone}</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.sectionTitle}>เสนอราคาถึง</Text>
            <Text style={[s.infoValue, s.bold]}>{data.buyer.name}</Text>
            <Text style={s.infoValue}>{data.buyer.address}</Text>
            {data.buyer.phone && <Text style={s.infoValue}>โทร {data.buyer.phone}</Text>}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.colNo}>ลำดับ</Text>
            <Text style={s.colDesc}>รายการ</Text>
            <Text style={s.colQty}>จำนวน</Text>
            <Text style={s.colUnit}>ราคาต่อหน่วย</Text>
            <Text style={s.colAmount}>จำนวนเงิน</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={s.colNo}>{i + 1}</Text>
              <Text style={s.colDesc}>{item.description}</Text>
              <Text style={s.colQty}>{item.quantity.toLocaleString()}</Text>
              <Text style={s.colUnit}>{formatMoney(item.unitPrice)}</Text>
              <Text style={s.colAmount}>{formatMoney(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={s.summaryBox}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>ราคาก่อนภาษี</Text>
            <Text style={s.summaryValue}>{formatMoney(data.subtotal)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>ภาษีมูลค่าเพิ่ม {data.vatRate}%</Text>
            <Text style={s.summaryValue}>{formatMoney(data.vatAmount)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, s.summaryTotal]}>รวมทั้งสิ้น</Text>
            <Text style={[s.summaryValue, s.summaryTotal]}>{formatMoney(data.total)}</Text>
          </View>
        </View>

        <View style={s.validityBox}>
          <Text>
            <Text style={s.bold}>ใบเสนอราคานี้มีอายุ 30 วัน</Text>
            {" "}(ถึงวันที่ {formatDate(data.validUntil)})
          </Text>
        </View>

        {data.notes && (
          <View style={[s.section, { marginTop: 10 }]}>
            <Text style={s.sectionTitle}>หมายเหตุ</Text>
            <Text style={s.infoValue}>{data.notes}</Text>
          </View>
        )}

        <View style={s.footer}>
          <View style={s.signatureBox}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>ผู้เสนอราคา</Text>
          </View>
          <View style={s.signatureBox}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>ผู้อนุมัติ</Text>
          </View>
        </View>

        <Text style={s.footerNote}>
          เอกสารนี้ออกโดยระบบอัตโนมัติ • This document is system-generated
        </Text>
      </Page>
    </Document>
  );
}
