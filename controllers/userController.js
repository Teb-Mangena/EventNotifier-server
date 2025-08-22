import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import sendEmail from "../utils/emailService.js";
import { format } from "date-fns";

// create a resuable token
const createToken = (id,surname,name) => {
  return jwt.sign(
    {id,surname,name},
    process.env.SECRET,
    {expiresIn:'3d'}
  );
}

// login user
export const loginUser = async (req,res) => {
  const {email,password} = req.body;

  try {
    const user = await User.login(email,password);

    // create token
    const token = createToken(
      user._id,
      user.lastName,
      user.name
    );

    res.status(200).json({
      email,
      name:user.name,
      lastName:user.lastName,
      role:user.role,
      token
    });

  } catch (error) {
    res.status(400).json({error:error.message || 'Invalid email or password'});
  }
}

// Signup user
export const signupUser = async (req, res) => {
  const {email, password, name, lastName, role} = req.body;

  try {
    const user = await User.signup(name, lastName, email, password, role);

    // create token
    const token = createToken(
      user._id,
      user.name,
      user.email
    );

    // Send welcome email for new signups
    try {
      const signupTime = format(new Date(), "EEEE, MMMM do, yyyy 'at' h:mm a");
      const plainTextMessage = `Welcome ${name} ${lastName}!

Thank you for creating an account with ${process.env.APP_NAME || 'Our Platform'}.

Your account has been successfully created with the following details:
- Email: ${email}
- Account Type: ${role}

We're excited to have you on board!

Thank you,
The ${process.env.APP_NAME || 'Our Platform'} Team`;

      const htmlMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #2c3e50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 0 0 5px 5px;
              border: 1px solid #ddd;
              border-top: none;
            }
            .detail-item {
              margin: 15px 0;
              padding: 15px;
              background-color: #fff;
              border-radius: 5px;
              border-left: 4px solid #4caf50;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 0.9em;
              color: #777;
            }
            .button {
              display: inline-block;
              background-color: #3498db;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome Aboard!</h1>
            <p>Your Account Has Been Created</p>
          </div>
          
          <div class="content">
            <p>Hello <strong>${name} ${lastName}</strong>,</p>
            
            <p>Thank you for creating an account with ${process.env.APP_NAME || 'Our Platform'}!</p>
            
            <div class="detail-item">
              <strong>Account Created:</strong> ${signupTime}<br>
              <strong>Email:</strong> ${email}<br>
              <strong>Account Type:</strong>
            </div>
            
            <p>We're excited to have you on board. You can now access all the features available to ${role} accounts.</p>
            
            <a href="${process.env.FRONTEND_URL || 'https://yourappdomain.com'}/login" class="button">
              Log In to Your Account
            </a>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>If you have any questions, please <a href="${process.env.FRONTEND_URL || 'https://yourappdomain.com'}/contact-support">contact our support team</a>.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: email,
        subject: `Welcome to ${process.env.APP_NAME || 'Our Platform'}!`,
        text: plainTextMessage,
        html: htmlMessage
      });
      
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (emailError) {
      // Don't fail the signup if email fails, just log it
      console.error('❌ Failed to send welcome email:', emailError.message);
    }

    res.status(201).json({
      email,
      name: user.name,
      lastName: user.lastName,
      role: user.role,
      token
    });

  } catch (error) {
    res.status(400).json({error: error.message || 'Invalid email or password'});
  }
}


// get all user for the admin
export const getUsers = async (req,res) => {
  try{
    const users = await User.find({}).sort({createdAt:-1});

    if(!users){
      return res.status(400).json({message:"No users found"});
    }

    res.status(200).json(users);

  } catch (error){
    res.status(500).json({error:error.message || "Server Error"});
  }
}

// Get a single user for the admin
export const getUser = async (req,res) => {
  const {id} = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)){
    return res.status(400).json({error:"Invalid user id"});
  }

  try{
    const user = await User.findById(id);

    if(!user){
      return res.status(400).json({error:"User was never found"});
    }

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({error:error.message});
  }
}

// Delete a user
export const deleteUser = async (req,res) => {
  const {id} = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)){
    return res.status(400).json({error:"Invalid user id"});
  }

  try{
    const user = await User.findOneAndDelete(id);

    if(!user){
      return res.status(400).json({error:"User was never found"});
    }

    res.status(200).json({message:"user deleted successfully",user});

  } catch (error) {
    res.status(500).json({error:error.message});
  }
}

// update a user
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, lastName, email, role } = req.body;

  // Check if ID is valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is being changed and if it's already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Prepare update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } // Return updated document and run validators
    );

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error("Error updating user:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already in use" });
    }
    
    res.status(500).json({ error: error.message || "Server error while updating user" });
  }
};