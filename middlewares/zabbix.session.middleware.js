import { redis } from "../config/redis.js";

export const zabbixSessionMiddleware = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.zbx_session;

        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const sessionData = await redis.get(`zabbix:session:${sessionId}`);

        if (!sessionData) {
            return res.status(401).json({
                success: false,
                message: "Session expired or invalid"
            });
        }

        const parsedSession = JSON.parse(sessionData);

        req.zabbix = {
            authToken: parsedSession.authToken,
            username: parsedSession.username
        };

        next();

    } catch (err) {
        next(err);
    }
};
