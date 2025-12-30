import cors from "cors";
import cookieParser from "cookie-parser";
import express from 'express';
import bodyParser from 'body-parser';

const securityMiddleware = (app) => {
    app.use(cors({
        origin: 'http://localhost:8009',
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
        exposedHeaders: ["Authorization"]
    }));

    app.use((req, res, next) => {
        res.setHeader(
            "Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "connect-src 'self' http://localhost:8009; " +
            "font-src 'self';"
        );
        next();
    });

    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
}

export default securityMiddleware;