import express from "express";
import zabbixRoutes from "./src/routes/zabix.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import securityMiddleware from "./middlewares/security.middleware.js";
const app = express();

app.use(express.static("public"));
securityMiddleware(app);

app.use("/api/v1", zabbixRoutes);

app.use("/", (req, res, next) => {
    res.send("Report ok for zabbix")
    next()
})

app.use((err, req, res, next) => {
    console.error(`Error caught by Global middleware: ${err.message}`);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.use(errorHandler);

export default app;