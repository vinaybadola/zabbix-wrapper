import { nodeEnv } from "../../config/env.config.js";
import ZabbixService from "../services/zabbix.service.js";

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

            const { sessionId } = await ZabbixService.login(username, password);

            res.cookie("zbx_session", sessionId, {
                httpOnly: true,
                secure: nodeEnv === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 1000
            });

            res.status(200).json({
                success: true,
                message: "Login successful"
            });

        } catch (err) {
            console.error("Zabbix login error:", err);
            next(err);
        }
    };

    static logout = async (req, res, next) => {
        try {


        } catch (err) {
            console.error(`Error occurred while logging out user : ${err.message}`);
            next(err);

        }
    }

    static async getAllRoles(req, res, next) {
        try {
            const data = await ZabbixService.getRoles({ authToken: req.zabbix.authToken });

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