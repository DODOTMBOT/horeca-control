export const runtime = "nodejs";

import { redirect } from "next/navigation";

export default function OwnerIndex() {
  redirect("/owner/users");
}
