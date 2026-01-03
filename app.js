import express from "express";
import zabbixRoutes from "./src/routes/zabix.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import securityMiddleware from "./middlewares/security.middleware.js";
const app = express();

app.use(express.static("public"));
securityMiddleware(app);

app.use("/api/zabbix/v1", zabbixRoutes);

app.use("/health", (req, res, next) => {
    res.send("Report ok for zabbix")
    next()
})

app.use(errorHandler);

export default app;
