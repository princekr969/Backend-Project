import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
try {
    
        // Get token
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }
    
        // Decode Jwt token
        const decodeTokenInformation = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // Get the user from DB
        const user = await User.findById(decodeTokenInformation?._id)
        .select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401, "Invalid Token Access");
        }
    
        req.user = user;
        next();
    
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
}

})