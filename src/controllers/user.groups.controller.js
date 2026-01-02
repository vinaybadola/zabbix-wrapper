import UserGroupService from "../services/user.group.service.js";

export default class UserGroupController {

    /* -------------------------
       GET USER GROUPS
    --------------------------*/
    static userGroups = async (req, res, next) => {
        try {
            const data = await UserGroupService.getUserGroupsWithUsers({
                authToken: req.zabbix.authToken
            });

            res.status(200).json({
                success: true,
                message: "ok",
                data,
                debug: {
                    totalGroups: data.length,
                    groupsWithHosts: data.filter(g => g.hostGroupIds.length > 0).length
                }
            });
        } catch (err) {
            next(err);
        }
    };

    /* -------------------------
       HOST GROUPS
    --------------------------*/
    static hostGroups = async (req, res, next) => {
        try {
            const data = await UserGroupService.getHostGroups({
                authToken: req.zabbix.authToken
            });

            res.status(200).json({ success: true, message: "ok", data });
        } catch (err) {
            next(err);
        }
    };

    /* -------------------------
       CREATE CLIENT GROUP
    --------------------------*/
    static createClientUserGroup = async (req, res, next) => {
        try {
            const { name, userIds = [], hostGroupIds } = req.body;

            if (!name || !Array.isArray(hostGroupIds)) {
                return res.status(400).json({
                    success: false,
                    message: "name and hostGroupIds[] required"
                });
            }

            const userGroupId = await UserGroupService.createUserGroup({
                name,
                userIds,
                authToken: req.zabbix.authToken
            });

            const permissions = await UserGroupService.setPermissions({
                userGroupId,
                hostGroupIds,
                permission: 2,
                authToken: req.zabbix.authToken
            });

            res.status(201).json({
                success: true,
                data: {
                    groupId: userGroupId,
                    permissions
                }
            });

        } catch (err) {
            next(err);
        }
    };

    /* -------------------------
       UPDATE PERMISSIONS
    --------------------------*/
    static updateUserGroupPermissions = async (req, res, next) => {
        try {
            const { userGroupId, hostGroupIds } = req.body;

            if (!userGroupId || !Array.isArray(hostGroupIds)) {
                return res.status(400).json({
                    success: false,
                    message: "userGroupId and hostGroupIds[] required"
                });
            }

            const result = await UserGroupService.setPermissions({
                userGroupId,
                hostGroupIds,
                permission: 2,
                authToken: req.zabbix.authToken
            });

            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    };

    /* -------------------------
       DELETE GROUP
    --------------------------*/
    static deleteUserGroup = async (req, res, next) => {
        try {
            const { groupId } = req.params;
            if (!groupId) {
                return res.status(400).json({
                    success: false,
                    message: "Group ID is required"
                });
            }

            const result = await UserGroupService.deleteUserGroup({
                groupId,
                authToken: req.zabbix.authToken
            });

            res.status(200).json({
                success: true,
                message: "Group deleted successfully",
                data: result
            });
        } catch (err) {
            next(err);
        }
    };
}
