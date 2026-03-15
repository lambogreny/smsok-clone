"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImportWizard from "../ImportWizard";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

export default function ImportPageClient() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(true);

  function handleComplete() {
    router.push("/dashboard/contacts");
  }

  function handleOpenChange(open: boolean) {
    setWizardOpen(open);
    if (!open) {
      router.push("/dashboard/contacts");
    }
  }

  return (
    <PageLayout>
      <PageHeader
        title="นำเข้ารายชื่อ"
        actions={
          <Link
            href="/dashboard/contacts"
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปรายชื่อ
          </Link>
        }
      />
      <ImportWizard
        open={wizardOpen}
        onOpenChange={handleOpenChange}
        onComplete={handleComplete}
      />
    </PageLayout>
  );
}
