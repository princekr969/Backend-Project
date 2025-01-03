import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    fullname: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },

    avatar: {
        type:String, //? Using cloudinary(like AWS) url of avatar img. 
        required: true,
    },

    coverImage: {
        type:String, //? Using cloudinary(like AWS) url of avatar img. 
        required: true,
    },

    watchHistory: [{
        type: Schema.Type.ObjectId,
        ref: "Video"
    }],

    password: {
        type: String,
        required: [true, "Password is required"]
    },

    refreshToken: {
        type: String,
    }
}, {timestamps: true});


// ? encryption the password
userSchema.pre("save", async function (next){ 
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

// ? Check the password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

// ? tokens generation
userSchema.method.generateAccessToken(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,  
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.method.generateRefreshToken(){
    return jwt.sign(
        {
            _id: this._id, 
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = mongoose.model("User", userSchema);

