import { redirect } from "next/navigation";

export default function MyPackagesRedirect() {
  redirect("/dashboard/packages/my");
}
