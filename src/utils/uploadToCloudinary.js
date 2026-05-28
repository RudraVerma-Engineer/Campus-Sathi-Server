import cloudinary from "../config/cloudinary.js";

const getResourceType = (mimetype) => {
  //image
  if (mimetype.startsWith("image/")) {
    return "image";
  }

  //video
  if (mimetype.startsWith("video/")) {
    return "video";
  }

  //everything else
  return "raw";
};

export const uploadToCloudinary = async (files, folderName = "general") => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadedFiles = [];

  for (const file of files) {
    const resourceType = getResourceType(file.mimetype);
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,

          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      );
      stream.end(file.buffer);
    });
    uploadedFiles.push({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      originalName: file.originalname,
      mimetype:file.mimetype,
      size:file.size,
    });
  }
  return uploadedFiles;
};
