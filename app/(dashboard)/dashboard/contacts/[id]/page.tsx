import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getContactById } from "@/lib/actions/contacts";
import { getCustomFields } from "@/lib/actions/custom-fields";
import ContactDetailClient from "./ContactDetailClient";
import { ErrorState } from "@/components/ErrorState";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  try {
    const [contact, customFields] = await Promise.all([
      getContactById(id),
      getCustomFields(),
    ]);

    if (!contact) notFound();

    // Serialize for client
    const serialized = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      tags: contact.tags,
      smsConsent: contact.smsConsent,
      consentStatus: contact.consentStatus,
      consentAt: contact.consentAt?.toISOString() ?? null,
      optOutAt: contact.optOutAt?.toISOString() ?? null,
      optOutReason: contact.optOutReason,
      createdAt: contact.createdAt.toISOString(),
      groups: contact.groups.map((g: (typeof contact.groups)[number]) => ({
        id: g.group.id,
        name: g.group.name,
      })),
      contactTags: contact.contactTags.map((ct: (typeof contact.contactTags)[number]) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        color: ct.tag.color,
      })),
      customFieldValues: contact.customFieldValues.map((cfv: (typeof contact.customFieldValues)[number]) => ({
        id: cfv.id,
        fieldId: cfv.fieldId,
        value: cfv.value,
        field: cfv.field,
      })),
    };

    const serializedFields = customFields.map((f: (typeof customFields)[number]) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      options: f.options,
      required: f.required,
      createdAt: f.createdAt.toISOString(),
    }));

    return (
      <ContactDetailClient contact={serialized} customFields={serializedFields} />
    );
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    return <ErrorState type="SERVER_ERROR" />;
  }
}
