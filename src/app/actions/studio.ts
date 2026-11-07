"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { run } from "@/lib/db";

export async function deleteAsset(form: FormData) {
  const user = await requireUser();
  run("DELETE FROM assets WHERE id = ? AND user_id = ?", String(form.get("id")), user.id);
  revalidatePath("/studio");
}

export async function updateAsset(assetId: string, content: string) {
  const user = await requireUser();
  run("UPDATE assets SET content = ? WHERE id = ? AND user_id = ?", content, assetId, user.id);
  revalidatePath("/studio");
}
