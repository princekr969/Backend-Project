import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
    
    // get user details
    const {username, fullname, email, password} = req.body;
    console.log("username: ",username, "email: ", email);

    // validation - empty field

    if([username, fullname, email, password].some((field) => (
        field?.trim() === ""
    ))){
        throw new ApiError(400, "All field are required");
    }

    // check if user already exits by username or email
    const exitedUser = User.findOne({
        $or: [{ username }, { email }],
    })

    if(exitedUser){
        throw new ApiError(409, "Username or Email already exists");
    }


    // get images and check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

    if(createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // return res  

    res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})

export {registerUser}