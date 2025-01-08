import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId);
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
    
        return {accessToken, refreshToken};
    
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    
    // get user details
    const {username, fullname, email, password} = req.body;
    // console.log("username: ",username, "email: ", email);

    // validation - empty field

    if([username, fullname, email, password].some((field) => (
        field?.trim() === ""
    ))){
        throw new ApiError(400, "All field are required");
    }

    // check if user already exits by username or email
    const exitedUser = await User.findOne({
        $or: [{ username }, { email }],
    })

    if(exitedUser){
        throw new ApiError(409, "Username or Email already exists");
    }


    // get images and check for avatar
    // console.log("Req files: ", req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar files required");
    }


    // upload them on cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar files required");
    }

    // create user object - create entry in db

    const user = await User.create({
        fullname,
        email,
        password,
        username,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    // check for user creation in db
    // remove password, refresh token from res
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // return res  

    res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})

const loginUser = asyncHandler(async (req, res) => {
    
    // fetch detail from req
    const {username, email, password} = req.body;
    
    if(!(username || email)){
        throw new ApiError(400, "username or email required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}],
    })

    if(!user){
        throw new ApiError(404, "user not found")
    }

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(404, "Invalid user password");
    }


    // generate access token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken");


    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(

        new ApiResponse(200, 
            {
            user: loggedInUser, refreshToken, refreshToken
            }
        , "User loggedIn successfully"
    ))

})

const loggedOut = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
}) 

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Access");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(400, "invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(400, "Refresh Token expiry or used");
    }

    const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id)
    
    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
        user: new ApiResponse(
            200,
            {accessToken, refreshToken},
            "Access token refreshed"
        )
    })

})

const changeUserPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body;

    if(newPassword !== confirmPassword){
        throw new ApiError(400, "new and confirm password not matched");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid user password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
});

const getCurrentUser = asyncHandler( async(req,res) => {
    return res.status(200).json(new ApiResponse(
        200,
        req.user,
        "Current user fetched successfully"
    ))
});

const updateUserDetails = asyncHandler(async (req, res) => {
    const {fullname, email} = req.body;

    if(!(fullname || email)){
        throw new ApiError(400, "All field must be filled");
    }

    const user = await User.findByIdAndUpdate( 
        req.user?_id,
        {
            $set: {
                fullname,
                email,
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(200, {
        UpdatedUser: user
    },
    "User details Updated successfully")
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const newUserAvatarLocalPath = req.file?.path;

    if(!newUserAvatarLocalPath){
        throw new ApiError(400, "invalid uploaded avatar");
    }

    const avatar = uploadOnCloudinary(newUserAvatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set: {
            avatar: avatar.url
        }},
        {new: true}
    ).select("-password")

    return res.status(200).json({
        user: new ApiResponse(200,
            user,
            "Avatar updated successfully"
        )
    })
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const newUserCoverImageLocalPath = req.file?.path;

    if(!newUserCoverImageLocalPath){
        throw new ApiError(400, "invalid cover image file");
    }

    const coverImage = uploadOnCloudinary(newUserCoverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set: {
            coverImage: coverImage.url
        }},
        {new: true}
    ).select("-password")

    return res.status(200).json({
        user: new ApiResponse(200,
            user,
            "coverImage updated successfully"
        )
    })
})

export {
    registerUser,
    loginUser,
    loggedOut,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser    ,
    updateUserAvatar,
    updateUserDetails,
    updateUserCoverImage,
}