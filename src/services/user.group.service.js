import ZabbixService from "./zabbix.service.js";

export default class UserGroupService {

    /* -------------------------
       FETCH GROUPS WITH USERS
    --------------------------*/
    static async getUserGroupsWithUsers({ authToken }) {
        const [groups, users] = await Promise.all([
            ZabbixService.rpcCall({
                method: "usergroup.get",
                params: {
                    output: ["usrgrpid", "name"],
                    selectUsers: ["userid", "username", "name", "surname"],
                    selectHostGroupRights: ["id", "permission"]
                },
                authToken
            }),
            ZabbixService.getUsersWithGroups({ authToken })
        ]);

        return groups.map(group => {
            const groupUsers = group.users || [];
            const hostPermissions = group.hostgroup_rights || [];

            return {
                usrgrpid: group.usrgrpid,
                name: group.name,
                users: groupUsers.map(u => ({
                    userid: u.userid,
                    username: u.username,
                    name: u.name || "",
                    surname: u.surname || "",
                    usrgrps: users.find(user => user.userid === u.userid)?.usrgrps || []
                })),
                hostPermissions,
                hostGroupIds: hostPermissions.map(h => h.id)
            };
        });
    }

    /* -------------------------
       HOST GROUPS
    --------------------------*/
    static async getHostGroups({ authToken }) {
        return ZabbixService.getHostGroups({ authToken });
    }

    /* -------------------------
       CREATE USER GROUP
    --------------------------*/
    static async createUserGroup({ name, userIds = [], authToken }) {
        const result = await ZabbixService.createUserGroup({
            name,
            userIds,
            authToken
        });

        const userGroupId = result.usrgrpids?.[0];
        if (!userGroupId) throw new Error("User group creation failed");

        return userGroupId;
    }

    /* -------------------------
       SET HOST GROUP PERMISSIONS
    --------------------------*/
    static async setPermissions({
        userGroupId,
        hostGroupIds,
        permission = 2,
        authToken
    }) {
        const ids = hostGroupIds.map(String);

        return ZabbixService.setUserGroupPermissions({
            userGroupId,
            hostGroupIds: ids,
            permission,
            authToken
        });
    }

    /* -------------------------
       DELETE USER GROUP
    --------------------------*/
    static async deleteUserGroup({ groupId, authToken }) {
        return ZabbixService.rpcCall({
            method: "usergroup.delete",
            params: [groupId],
            authToken
        });
    }
}
