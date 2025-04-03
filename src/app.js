import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//allow cors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// for accepting data in json form while filling forms
app.use(express.json({limit:"16kb"}));
 
// for accepting data from url
app.use(express.urlencoded({extended : true, limit : "16kb"})); //extended is used for accepting objects in objects data

//for accepting data from public folder like images and all
app.use(express.static("public"));

//for enabling access to browser's cookie
app.use(cookieParser());

