import { redirect } from "next/navigation";

export default function SettingsApiKeysRedirect() {
  redirect("/dashboard/api-keys");
}
