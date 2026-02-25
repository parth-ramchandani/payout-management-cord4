import { redirect } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  redirect("/payouts");
}
