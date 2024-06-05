import mongoose , {Schema} from "mongoose";
import bcrypt from 'bcrypt'                  //used to hash your password                                         
import jwt from 'jsonwebtoken'
//   JWT stands for JSON Web Token, and it is a commonly used stateless user authentication
//   standard used to securely transmit information between client and server in a JSON 
//   format. A JWT is encoded and not encrypted by default. It is digitally signed using a 
//   secret key known only to the server.


const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        lowercase:true,
        index:true,
        trim:true
    },
    avatar:{
        type:String,          //cloudnary url
        required:true
    },
    coverImage:{ 
        type:String          //cloudnary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:'Video'
        }
    ],
    password:{
        type:String,
        required:[true, "Password is required"]
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save" , async function(next){         //pre means next se pehle password save kr loh using bcrypt hash
   if(!this.isModified("password")) return next();    //agar password modifie nhi karna toh return direct next otherwise save password 

   this.password = await bcrypt.hash(this.password , 10)    //ya toh password rakhte time save hoga ya fir change (modifie ke time)
   next()
})

userSchema.methods.isPasswordCorrect = async function(password){   //khud ke custom method bhi define kr sakte hai eg.isPasswordCorrect
   return await bcrypt.compare(password ,this.password)           //bcrypt ke pass compare property hai compare password or jo iska password hai this.password it give values in tryue and false 
}

userSchema.methods.generateAccessToken = function(){
   return jwt.sign({
        _id : this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User",userSchema)