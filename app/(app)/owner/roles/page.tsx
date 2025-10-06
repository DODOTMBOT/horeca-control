import { redirect } from "next/navigation";

export default function OwnerRolesPage() {
  redirect("/owner/users?tab=roles");
}