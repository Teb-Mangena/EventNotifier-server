import express from "express";
import { deleteUser, getUser, getUsers, loginUser, signupUser, updateUser } from "../controllers/userController.js";

const router = express.Router();

// login user
router.post('/login',loginUser);

// signup user
router.post('/signup',signupUser);

// get all users
router.get('/',getUsers);

// get a user
router.get('/:id',getUser);

// delete a user
router.delete('/:id',deleteUser);

router.patch('/:id', updateUser);



export default router;