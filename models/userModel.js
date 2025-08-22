import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
},{timestamps:true});

// signup static method
userSchema.statics.signup = async function (name,lastName,email,password,role = "user"){
  // validation
  if(!name || !lastName || !email || !password){
    throw Error('All fields must be filled');
  }
  if(!validator.isEmail(email)){
    throw Error('Please enter a valid email');
  }
  if(!validator.isStrongPassword(password)){
    throw Error('Please enter a strong password');
  }

  // check if email exists
  const exists = await this.findOne({email});

  if(exists){
    throw Error('Email already exists');
  }

  // generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password,salt);

  // create user
  const user = await this.create({name,lastName,email,password:hash,role});

  return user
}

// login static method
userSchema.statics.login = async function (email,password){
  // validation
  if(!email || !password){
    throw Error('All fields must be filled');
  }

  // find match
  const user = await this.findOne({email});

  if(!user){
    throw Error('Incorrect Email');
  }

  // compare passwords
  const match = await bcrypt.compare(password,user.password);

  if(!match){
    throw Error('Incorrect password');
  }

  return user
}

// Check Admin Access
userSchema.statics.adminLogin = async function (email,password){
  const user = await this.login(email,password);

  if(user.role !== "admin"){
    throw new Error("Access denied! Admins only.");
  }

  return user;
}


export default mongoose.model('User',userSchema);