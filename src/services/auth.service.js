import crypto from "crypto";
import { redis } from "../../config/redis.js";
import ZabbixService from "./zabbix.service.js";

export default class AuthService {

    static async login(username, password) {
        const authToken = await ZabbixService.rpcCall({
            method: "user.login",
            params: { username, password }
        });

        const [user] = await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                output: ["userid", "username", "name", "surname"],
                filter: { username }
            },
            authToken
        });

        const sessionId = crypto.randomUUID();

        await redis.set(
            `zabbix:session:${sessionId}`,
            JSON.stringify({
                authToken,
                user: {
                    userid: user.userid,
                    username: user.username,
                    name: user.name,
                    surname: user.surname
                }
            }),
            "EX",
            86400
        );

        return {
            sessionId,
            user: {
                username: user.username,
                name: user.name,
                surname: user.surname
            }
        };
    }

    static async logout(sessionKey) {
        const sessionData = await redis.get(sessionKey);

        if (!sessionData) {
            return;
        }

        let authToken;
        try {
            ({ authToken } = JSON.parse(sessionData));
        } catch (e) {
            console.warn("Invalid session data, deleting key");
            await redis.del(sessionKey);
            return;
        }

        try {
            await ZabbixService.rpcCall({
                method: "user.logout",
                params: [],
                authToken
            });
        } catch (e) {
            console.warn("Zabbix logout failed:", e.message);
        }

        await redis.del(sessionKey);
    }

    static async getRoles({ authToken }) {
        if (!authToken) {
            throw new Error("Please provide the auth token for fetchign roles!")
        }
        return await ZabbixService.rpcCall({
            method: "role.get",
            params: {
                output: ["roleid", "name", "type"]
            },
            authToken
        });
    }
}