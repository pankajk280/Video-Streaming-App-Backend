import mongoose, {Schema} from "mongoose";
import bcrypt from bcrypt;

const userSchema = new Schema({
    userName: {
        type: String,
        required: [true,"User name is required"],
        trim: true,
        unique: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        trim: true, 
        unique: true,
        lowercase: true,
    },
    fullname: {
        type: String,
        required: true,
        trim : true,
        index: true // for more searchable fields
    },
    avatar: {
        type: String, //cloudinary url
    },
    coverImage: {
        type: String,
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    password : {
        type: String,
        required : true,
    },
    refreshToken:{
        type : String
    }
}, {timestamps: true});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next(); //check if password is modified or not (isModified is fn of mongoose)
    this.password = await bcrypt.hash(this.password,15);
    next();
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

export const user = mongoose.model("User",userSchema);