const cloudinary = require("cloudinary").v2;
const DataUriParser = require("datauri/parser");
const path = require("path");

const uploadToCloud = async (file) => {
  const parser = new DataUriParser();

  const extName = path.extname(file.originalname).toString();

  const { content } = parser.format(extName, file.buffer);

  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No file found");
    }

    cloudinary.uploader.upload(
      content,
      {
        upload_preset: process.env.CLOUD_UPLOAD_PRESET,
        folder: process.env.CLOUD_FILE_FOLDER,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({ url: result?.secure_url, publicId: result?.public_id });
        }
      }
    );
  });
};

const deleteFromCloud = async (publicIdArray) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIdArray);
    return result;
  } catch (error) {
    throw Error(error);
  }
};

module.exports = { uploadToCloud, deleteFromCloud };
