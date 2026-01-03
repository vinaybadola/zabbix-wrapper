import HostService from "./host.service.js";
import ZabbixService from "./zabbix.service.js";

export default class UserService {

    static async createUser({
        username,
        password,
        name,
        surname,
        roleId,
        authToken
    }) {
        if (!authToken) {
            throw new Error("No auth token provided for creating user !");
        }
        return await ZabbixService.rpcCall({
            method: "user.create",
            params: {
                username,
                passwd: password,
                name,
                surname,
                roleid: roleId,
            },
            authToken
        });
    }

    static async updateUser({ authToken, payload }) {
        if (!authToken) {
            throw new Error("No auth token provided for creating user !");
        }
        return await ZabbixService.rpcCall({
            method: "user.update",
            params: payload,
            authToken
        });
    }

    static async fetchUserHostGroups({ userId, authToken }) {
        if (!authToken) {
            throw new Error("No authToken provided");
        }

        if (!userId) {
            throw new Error("No userId provided");
        }

        const user = await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                userids: userId,
                output: ["userid", "username"],
                selectUsrgrps: "extend"
            },
            authToken
        });

        if (!user.length) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const userGroups = user[0].usrgrps || [];

        const groupsWithHosts = await Promise.all(
            userGroups.map(async (group) => {
                const groupDetails = await ZabbixService.rpcCall({
                    method: "usergroup.get",
                    params: {
                        usrgrpids: group.usrgrpid,
                        output: ["usrgrpid", "name"],
                        selectHostGroupRights: "extend"
                    },
                    authToken,
                });

                if (groupDetails.length > 0) {
                    const hostPermissions = groupDetails[0].hostgroup_rights || [];
                    const hostGroupIds = hostPermissions.map(hp => hp.id);

                    return {
                        usrgrpid: group.usrgrpid,
                        name: group.name,
                        hostPermissions: hostPermissions,
                        hostGroupIds: hostGroupIds
                    };
                }

                return {
                    usrgrpid: group.usrgrpid,
                    name: group.name,
                    hostPermissions: [],
                    hostGroupIds: []
                };
            })
        );

        const allHostGroupIds = [
            ...new Set(
                groupsWithHosts.flatMap(g => g.hostGroupIds)
            )
        ];

        if (allHostGroupIds.length === 0) {
            return groupsWithHosts;
        }

        const hostGroups = await HostService.getHostGroups({ authToken });

        const hostGroupIdToName = new Map(
            hostGroups.data.map(hg => [hg.groupid, hg.name])
        );

        return groupsWithHosts.map(group => ({
            usrgrpid: group.usrgrpid,
            name: group.name,
            hostGroups: group.hostPermissions.map(hp => ({
                groupId: hp.id,
                name: hostGroupIdToName.get(hp.id) || "Unknown",
                permission: Number(hp.permission)
            }))
        }));
    }

    static async getUsers({ authToken, search = null }) {
        if (!authToken) {
            throw new Error("No auth token provided!");
        }

        const params = {
            output: ["userid", "username", "name", "surname"],
            selectRole: ["roleid", "name"],
            sortfield: "userid",
            sortorder: "DESC",
        };

        if (search) {
            params.search = {
                username: search,
                name: search,
                surname: search
            };
            params.searchWildcardsEnabled = true;
        }

        return await ZabbixService.rpcCall({
            method: "user.get",
            params,
            authToken
        });
    }

    static async deleteUser({ authToken, userid }) {
        if (!authToken) {
            throw new Error("No auth token provided for creating user !");
        }
        try {
            const response = await ZabbixService.rpcCall({
                method: "user.delete",
                params: [userid],
                authToken
            });

            return response;
        } catch (err) {
            console.error(`Zabbix API deleteUser error: ${err.message}`);
            throw err;
        }
    }

}