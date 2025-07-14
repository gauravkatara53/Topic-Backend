// utils/deleteFromSupabase.js

import { supabase } from "./supabaseClient.js"; // ✅ add `.js` at the end

/**
 * Delete a file from Supabase storage using its full public URL.
 * @param {string} imageUrl
 * @returns {Promise<boolean>}
 */
export const deleteFromSupabase = async (imageUrl) => {
  try {
    const decodedUrl = decodeURIComponent(imageUrl);

    const PREFIX = "/storage/v1/object/public/topic/";
    const index = decodedUrl.indexOf(PREFIX);

    if (index === -1) {
      console.error("Invalid Supabase image URL.");
      return false;
    }

    const filePath = decodedUrl.substring(index + PREFIX.length); // image/filename.png

    const { error } = await supabase.storage
      .from("topic") // replace with your bucket name if different
      .remove([filePath]);

    if (error) {
      console.error("❌ Supabase deletion error:", error.message);
      return false;
    }

    console.log("✅ Deleted:", filePath);
    return true;
  } catch (err) {
    console.error("Error in deleteFromSupabase:", err);
    return false;
  }
};
