import { redirect } from "next/navigation";

/** Route cũ — gom về Master Admin Console */
export default function AccountsRedirect() {
  redirect("/admin/board-home");
}
