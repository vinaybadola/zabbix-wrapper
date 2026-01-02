import ZabbixService from "./zabbix.service.js";

export default class HostService {

    static async createHost({
        host,
        name,
        ip,
        groupIds = [],
        templateIds = [],
        authToken
    }) {
        if (!groupIds.length) {
            throw new Error("At least one host group is required");
        }

        const params = {
            host,
            name,
            interfaces: [
                {
                    type: 1,
                    main: 1,
                    useip: 1,
                    ip,
                    dns: "",
                    port: "10050"
                }
            ],
            groups: groupIds.map(id => ({ groupid: id }))
        };

        if (templateIds.length) {
            params.templates = templateIds.map(id => ({ templateid: id }));
        }

        return await ZabbixService.rpcCall({
            method: "host.create",
            params,
            authToken
        });
    }

    static getAllHosts = async (authToken) => {
        if (!authToken) {
            throw new Error("No authToken provided for fetching all hosts");
        }
        return await ZabbixService.rpcCall({
            method: "host.get",
            params: {
                output: ["hostid", "name"],
                monitored_hosts: true
            },
            authToken
        });
    };

    static async fetchHostsFromHostGroup({ hostGroupIds = [], authToken }) {
        if (!authToken) {
            throw new Error("No authToken provided");
        }

        if (!Array.isArray(hostGroupIds) || hostGroupIds.length === 0) {
            return [];
        }
        return await ZabbixService.rpcCall({
            method: "host.get",
            params: {
                groupids: hostGroupIds,
                output: ["hostid", "name"]
            },
            authToken
        });
    }

    static async fetchHostItems({
        hostIds,
        authToken,
        searchText,
        searchBy = "name",
        exact = false
    }) {
        if (!authToken) throw new Error("No authToken");

        const params = {
            hostids: hostIds,
            output: ["itemid", "name", "key_"]
        };

        const cleanText = searchText
            ?.replace(/\n/g, "")
            ?.replace(/\s+/g, " ")
            ?.trim();

        if (cleanText) {
            if (exact) {
                params.filter = { [searchBy]: cleanText };
            } else {
                params.search = { [searchBy]: cleanText };
                params.searchWildcardsEnabled = true;
            }
        }

        console.log("FINAL PARAMS:", JSON.stringify(params, null, 2));

        return ZabbixService.rpcCall({
            method: "item.get",
            params,
            authToken
        });
    }

    static async createHostGroup({ name, authToken }) {
        if (!authToken) {
            throw new Error("No authToken provided for createHostGroup");
        }
        return await ZabbixService.rpcCall({
            method: "hostgroup.create",
            params: { name },
            authToken
        });
    }

    static async addHostToGroup({ hostId, groupId, authToken }) {
        if (!authToken) {
            throw new Error("No authToken provided for addHostToGroup");
        }
        return await ZabbixService.rpcCall({
            method: "host.update",
            params: {
                hostid: hostId,
                groups: [{ groupid: groupId }]
            },
            authToken
        });
    }

    static async getHostGroups({ authToken }) {
        const groups = await ZabbixService.rpcCall({
            method: "hostgroup.get",
            params: {
                output: ["groupid", "name"],
                sortfield: "name"
            },
            authToken
        });

        return {
            success: true,
            data: groups
        };
    }
}