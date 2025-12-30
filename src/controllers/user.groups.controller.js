import ZabbixService from "../services/zabbix.service.js";

export default class UserGroupController {
    static userGroups = async (req, res, next) => {
        try {
            const data = await zabbixService.getUserGroups({ authToken: req.zabbix.authToken });

            return res.status(200).json({
                success: true,
                message: "ok",
                data
            });

        } catch (error) {
            console.error(`Error fetching user groups : ${err}`)
            next(error);
        }
    }

    static hostGroups = async (req, res, next) => {
        try {
            const data = await zabbixService.getHostGroups({ authToken: req.zabbix.authToken });

            return res.status(200).json({
                success: true,
                message: "ok",
                data
            });

        } catch (error) {
            console.error(`Error fetching host groups : ${err}`)
            next(error);
        }
    }

    static createClientUserGroup = async (req, res, next) => {
        try {
            const { name, userIds, hostGroupIds } = req.body;

            if (!name || !Array.isArray(hostGroupIds)) {
                return res.status(400).json({
                    success: false,
                    message: "name and hostGroupIds[] are required"
                });
            }

            const result = await zabbixService.createUserGroup({
                name,
                userIds,
                hostGroupIds,
                authToken: req.zabbix.authToken
            });

            const userGroupId = result.usrgrpids[0];

            await zabbixService.setUserGroupPermissions({
                userGroupId,
                hostGroupIds,
                permission: 2, // READ ONLY
                authToken: req.zabbix.authToken
            });


            res.status(201).json({
                success: true,
                data: result
            });

        } catch (err) {
            console.log(`Error creating client user group : ${err.message}`);
            next(err);
        }
    };

    static updateUserGroupPermissions = async (req, res, next) => {
        try {
            const { userGroupId, hostGroupIds } = req.body;

            if (!userGroupId || !Array.isArray(hostGroupIds)) {
                return res.status(400).json({
                    success: false,
                    message: "userGroupId and hostGroupIds[] are required"
                });
            }

            const result = await ZabbixService.setUserGroupPermissions({
                userGroupId,
                hostGroupIds,
                permission: 2,
                authToken: req.zabbix.authToken
            });

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (err) {
            console.error("Error updating user group permissions:", err.message);
            next(err);
        }
    };
}