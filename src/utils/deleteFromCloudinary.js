import cloudinary from "../config/cloudinary.js";

export const deleteFromCloudinary = async (files = []) => {

  if(!Array.isArray(files)){
    files = [files];
  }
  const failedFiles = [];

  if (!files.length) {
    return [];
  }
  
  await Promise.all(
    files.map(async (file) => {
      try {
        if (!file.public_id) {
          return;
        }

        await cloudinary.uploader.destroy(file.public_id, {
          resource_type: file.resource_type || "image",
        });
      } catch (error) {
        failedFiles.push({
          public_id: file.public_id,

          error: error.message,
        });
      }
    }),
  );
  return failedFiles;
};
