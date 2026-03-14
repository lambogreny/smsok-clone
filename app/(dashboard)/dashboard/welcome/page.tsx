import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSenderNames } from "@/lib/actions/sender-names";
import { getContacts } from "@/lib/actions/contacts";
import { getDashboardStats } from "@/lib/actions/sms";
import { getRemainingQuota } from "@/lib/package/quota";
import WelcomeContent from "./WelcomeContent";

export default async function WelcomePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const completedSteps: string[] = [];

  try {
    const [senderNames, contacts, stats, quota] = await Promise.all([
      getSenderNames().catch(() => []),
      getContacts().catch(() => ({ contacts: [], total: 0 })),
      getDashboardStats().catch(() => null),
      getRemainingQuota(user.id).catch(() => ({
        packages: [],
        totalSms: 0,
        totalUsed: 0,
        totalRemaining: 0,
        senderNameLimit: null,
      })),
    ]);

    if (Array.isArray(senderNames) && senderNames.length > 0) {
      completedSteps.push("sender");
    }

    const contactList = Array.isArray(contacts) ? contacts : contacts?.contacts;
    if (Array.isArray(contactList) && contactList.length > 0) {
      completedSteps.push("contacts");
    }

    if (stats && (stats.today.total > 0 || stats.thisMonth.total > 0)) {
      completedSteps.push("test-sms");
    }

    // API step — we don't check for now, user must visit the page
  } catch {
    // Continue with empty steps on error
  }

  const firstName = user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "";

  return (
    <WelcomeContent
      firstName={firstName}
      completedSteps={completedSteps}
      smsRemaining={15}
    />
  );
}
