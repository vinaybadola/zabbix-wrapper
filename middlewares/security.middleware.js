import cors from "cors";
import cookieParser from "cookie-parser";
import express from 'express';
import bodyParser from 'body-parser';

const securityMiddleware = (app) => {
    app.use(cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
        exposedHeaders: ["Authorization"]
    }));

    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
}

export default securityMiddleware;