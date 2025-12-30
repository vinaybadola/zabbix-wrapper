import zabbixService from "../services/zabbix.service.js";

export default class UserController {

    static createClientUser = async (req, res, next) => {
        try {
            const {
                username,
                passwd,
                name,
                surname,
                roleId,
            } = req.body;

            if (!username || !passwd || !roleId) {
                return res.status(400).json({
                    success: false,
                    message: "username, passwd and roleId are required"
                });
            }

            const result = await zabbixService.createUser({
                username,
                password: passwd,
                name,
                surname,
                roleId,
                authToken: req.zabbix.authToken
            });

            return res.status(201).json({
                success: true,
                message: "ok",
                data: result
            });

        } catch (err) {
            next(err);
        }
    };

    static updateClientUser = async (req, res, next) => {
        try {
            const { userid, username, name, surname, roleId } = req.body;

            if (!userid) {
                return res.status(400).json({
                    success: false,
                    message: "userid is required for update"
                });
            }

            const payload = {
                userid
            };

            // Optional updates (only send what is provided)
            if (username) payload.username = username;
            if (name) payload.name = name;
            if (surname) payload.surname = surname;
            if (roleId) payload.roleid = roleId;

            await zabbixService.updateUser({
                authToken: req.zabbix.authToken,
                payload
            });

            return res.status(200).json({
                success: true,
                message: "User updated successfully"
            });

        } catch (err) {
            console.error(`Error updating user: ${err.message}`);
            next(err);
        }
    };

    static async getAllUsers(req, res, next) {
        try {
            const data = await zabbixService.getUsers({ authToken: req.zabbix.authToken });

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

    static deleteClientUser = async (req, res, next) => {
        try {
            const { userid } = req.body;

            if (!userid) {
                return res.status(400).json({
                    success: false,
                    message: "userid is required for deletion"
                });
            }

            await zabbixService.deleteUser({
                authToken: req.zabbix.authToken,
                userid: parseInt(userid)
            });

            return res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });

        } catch (err) {
            console.error(`Error deleting user: ${err.message}`);
            next(err);
        }
    };
}