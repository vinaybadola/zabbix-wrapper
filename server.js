import app from "./app.js";
import { port } from "./config/env.config.js";

app.use((req, res, next) => {
    if (!res.headersSent) {
        console.warn(`404 - Route not found: ${req.originalUrl}`);
        res.status(404).json({
            status: 'error',
            message: 'Endpoint not found',
            requestedUrl: req.originalUrl
        });
    }
});

process.on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.message} : ${err.stack}`);
    server.close(() => process.exit(1));
});

process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

app.listen(port, () => {
    console.log(`HTTP Wrapper running on port ${port}`);
});