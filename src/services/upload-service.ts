import { createClient } from "@/lib/supabase/client";

export async function uploadEventMedia(
  file: File,
  folder: "banners" | "thumbnails"
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("event_media")
    .upload(fileName, file, { cacheControl: "31536000", upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: publicUrl } = supabase.storage
    .from("event_media")
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}
