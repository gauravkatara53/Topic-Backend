// utils/fileUpload.js
import { supabase } from "./supabaseClient.js";
import fs from "fs";
import path from "path";
import mime from "mime-types";

export const uploadOnSupabase = async (localFilePath, subfolder = "") => {
  try {
    if (!localFilePath) return null;

    console.log("Uploading file to Supabase:", localFilePath);

    const fileBuffer = fs.readFileSync(localFilePath);
    const fileName = `${Date.now()}-${path.basename(localFilePath)}`;

    // File path inside the bucket
    const filePath = subfolder ? `${subfolder}/${fileName}` : fileName;

    const contentType =
      mime.lookup(localFilePath) || "application/octet-stream";

    const { data, error } = await supabase.storage
      .from("topic") // ✅ your actual bucket name
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading to Supabase:", error.message);
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
      return null;
    }

    // Delete temp file after successful upload
    fs.unlinkSync(localFilePath);

    const { data: publicUrlData } = supabase.storage
      .from("topic")
      .getPublicUrl(filePath);

    console.log("File uploaded to Supabase:", publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading to Supabase:", error.message);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};
