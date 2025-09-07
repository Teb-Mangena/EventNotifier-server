import express, { urlencoded } from "express";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
// configure dotenv
import "dotenv/config";
import userRoutes from "./routes/userRoutes.js";
import eventRoute from "./routes/eventsRoute.js";
import oppoRoute from "./routes/opportunityRoutes.js";
import register from "./routes/eventRegistRoutes.js";

// create express app
const app = express();

// from env file
const PORT = process.env.PORT || 5050;
const {MONGO_URI} = process.env;

// middlewares
app.use(express.json());
app.use(urlencoded({extended:true}));
app.use(cors());
app.use(morgan('dev'));

// routes
app.use('/api/users',userRoutes);
app.use('/api/events',eventRoute);
app.use('/api/opportunities',oppoRoute);
app.use('/api/event-register',register);

// connect to DB
mongoose.connect(MONGO_URI)
  .then(()=>{
    // listen for request
    app.listen(PORT, (req,res)=>{
      console.log(`Connected to DB & Listening on http://localhost:${PORT}/`);
    });
  })
  .catch((err)=>{
    console.log(err)
  })