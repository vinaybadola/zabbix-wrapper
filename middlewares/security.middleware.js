import cors from "cors";
import cookieParser from "cookie-parser";
import express from 'express';
import bodyParser from 'body-parser';
import { appOrigins } from "../config/env.config.js";

const securityMiddleware = (app) => {
    const origins = appOrigins
        .split(",")
        .map(o => o.trim())
        .filter(Boolean);

    const cspConnectSrc = origins.join(" ");

    app.use(cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (origins.includes(origin)) return cb(null, true);
            return cb(null, false); 
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
        allowedHeaders: [
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin"
        ],
        exposedHeaders: ["Authorization"]
    }));

    app.use((req, res, next) => {
        res.setHeader(
            "Content-Security-Policy",
            [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'", // IMPORTANT for now
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                `connect-src 'self' ${cspConnectSrc}`,
                "font-src 'self'"
            ].join("; ")
        );
        next();
    });

    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
}

export default securityMiddleware;