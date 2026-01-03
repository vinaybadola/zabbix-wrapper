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
                    selectHostGroupRights: ["id", "permission"],
                    sortfield: "usrgrpid",
                    sortorder: "DESC"
                },
                authToken
            }),
            this.getUsersWithGroups({ authToken })
        ]);

        return groups.map(group => {
            const groupUsers = (group.users || [])
                .sort((a, b) => Number(b.userid) - Number(a.userid));

            const hostPermissions = group.hostgroup_rights || [];

            return {
                usrgrpid: group.usrgrpid,
                name: group.name,
                users: groupUsers.map(u => ({
                    userid: u.userid,
                    username: u.username,
                    name: u.name || "",
                    surname: u.surname || "",
                    usrgrps:
                        users.find(user => user.userid === u.userid)?.usrgrps || []
                })),
                hostPermissions,
                hostGroupIds: hostPermissions.map(h => h.id)
            };
        });
    }

    /* -------------------------
       CREATE USER GROUP
    --------------------------*/
    static async createUserGroup({ name, userIds = [], authToken }) {
        if (!name) {
            throw new Error("Group name is required");
        }
        const result = await ZabbixService.rpcCall({
            method: "usergroup.create",
            params: {
                name,
                users: userIds.map(id => ({ userid: id }))
            },
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

        return this.setUserGroupPermissions({
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

    static async getUsersWithGroups({ authToken }) {
        if (!authToken) {
            throw new Error("No authToken provided");
        }

        return await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                output: ["userid", "username", "name", "surname"],
                selectUsrgrps: ["usrgrpid", "name"]
            },
            authToken
        });
    }

    static async setUserGroupPermissions({
        userGroupId,
        hostGroupIds,
        permission = 2, // 2 = READ, 3 = WRITE
        authToken
    }) {
        if (!userGroupId || !Array.isArray(hostGroupIds) || !hostGroupIds.length) {
            throw new Error("userGroupId and hostGroupIds are required");
        }

        // 1️⃣ ENABLE GUI ACCESS (CRITICAL)
        await ZabbixService.rpcCall({
            method: "usergroup.update",
            params: {
                usrgrpid: userGroupId,
                gui_access: 1
            },
            authToken
        });

        // 2️⃣ SET HOST GROUP PERMISSIONS
        const updateResult = await ZabbixService.rpcCall({
            method: "usergroup.update",
            params: {
                usrgrpid: userGroupId,
                hostgroup_rights: hostGroupIds.map(id => ({
                    id,          // <-- REQUIRED for your Zabbix version
                    permission   // 2 = READ, 3 = WRITE
                }))
            },
            authToken
        });

        // 3️⃣ OPTIONAL VERIFICATION (safe to keep during dev)
        const verifyResult = await ZabbixService.rpcCall({
            method: "usergroup.get",
            params: {
                usrgrpids: userGroupId,
                selectHostGroupRights: "extend",
                output: ["gui_access"]
            },
            authToken
        });

        return {
            updateResult,
            verifyResult
        };
    }

    /* -------------------------
   UPDATE USER GROUP
--------------------------*/
    static async updateUserGroup({ userGroupId, name, userIds = [], authToken }) {
        if (!userGroupId) {
            throw new Error("userGroupId is required");
        }

        const params = {
            usrgrpid: userGroupId
        };

        if (name) {
            params.name = name;
        }

        if (Array.isArray(userIds)) {
            params.users = userIds.map(id => ({ userid: id }));
        }

        await ZabbixService.rpcCall({
            method: "usergroup.update",
            params,
            authToken
        });

        return true;
    }

    /* -------------------------
   UPDATE HOST GROUP PERMISSIONS
--------------------------*/
    static async updatePermissions({
        userGroupId,
        hostGroupIds,
        permission = 2,
        authToken
    }) {
        if (!userGroupId || !Array.isArray(hostGroupIds)) {
            throw new Error("userGroupId and hostGroupIds are required");
        }

        const rights = hostGroupIds.map(id => ({
            id: String(id),
            permission
        }));

        await ZabbixService.rpcCall({
            method: "usergroup.update",
            params: {
                usrgrpid: userGroupId,
                hostgroup_rights: rights
            },
            authToken
        });

        return true;
    }
}
