import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_API_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    if(!localFilePath) return Error("File not found !!");

    try {
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })

        // file has been uploaded on cloudinary
        fs.unlinkSync(localFilePath); 
        // console.log("response: ", response);
        return response;
    } catch (error) {
            fs.unlinkSync(localFilePath); 
            // remove the locally saved temporary file as the upload operation got failed
            return null
    }
}

export {uploadOnCloudinary}