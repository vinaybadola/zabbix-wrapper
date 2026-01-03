import { nodeEnv } from "../../config/env.config.js";
import { redis } from "../../config/redis.js";
import AuthService from "../services/auth.service.js";

export default class AuthController {

    static login = async (req, res, next) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Username and password are required"
                });
            }

            const { sessionId, user } = await AuthService.login(username, password);

            res.cookie("zbx_session", sessionId, {
                httpOnly: true,
                secure: nodeEnv === "production",
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: user
            });

        } catch (err) {
            console.error("Zabbix login error:", err.message);
            next(err);
        }
    };

    static logout = async (req, res, next) => {
        try {
            const sessionId = req.cookies?.zbx_session

            if (sessionId) {
                const sessionKey = `zabbix:session:${sessionId}`;
                await AuthService.logout(sessionKey);
            }

        } catch (err) {
            console.warn("Logout cleanup failed:", err.message);
        }

        res.clearCookie("zbx_session", {
            httpOnly: true,
            sameSite: "strict",
            secure: nodeEnv === "production"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    };

    static me = async (req, res, next) => {
        try {
            const sessionId = req.cookies?.zbx_session;
            if (!sessionId) {
                return res.status(401).json({ success: false });
            }

            const session = await redis.get(`zabbix:session:${sessionId}`);
            if (!session) {
                return res.status(401).json({ success: false });
            }

            const { user } = JSON.parse(session);

            return res.json({
                success: true,
                user
            });

        }
        catch (err) {
            console.error(`Error fetching user details : ${err}`);
            next(err);
        }

    };

    static getAllRoles = async (req, res, next) => {
        try {
            const data = await AuthService.getRoles({ authToken: req.zabbix.authToken });

            return res.status(200).json({
                success: true,
                message: "ok",
                data
            });

        }
        catch (err) {
            console.error(`Error occurred while fetching all users : ${err.message}`);
            next(err);
        }
    }
}