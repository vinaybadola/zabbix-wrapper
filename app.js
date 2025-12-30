import express from "express";
import zabbixRoutes from "./src/routes/zabix.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import securityMiddleware from "./middlewares/security.middleware.js";
const app = express();

securityMiddleware(app);

app.use("/api/zabbix/v1", zabbixRoutes);

app.use(errorHandler);

export default app;
