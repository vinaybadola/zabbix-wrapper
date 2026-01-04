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

    static getAllHosts = async ({ authToken }) => {
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

        params.search = {
            name: "*Bits*"
        };
        params.searchWildcardsEnabled = true;

        const cleanText = searchText
            ?.replace(/\n/g, "")
            ?.replace(/\s+/g, " ")
            ?.trim();

        if (cleanText) {
            params.search[searchBy] = `*${cleanText}*`;
        }

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

    static async getHostGroups({ authToken, search }) {
        const params = {
            output: ["groupid", "name"],
            sortfield: "name"
        };

        const allGroups = await ZabbixService.rpcCall({
            method: "hostgroup.get",
            params: params,
            authToken
        });

        let filteredGroups;

        if (search && search.trim() !== '') {
            const searchLower = search.toLowerCase().trim();
            filteredGroups = allGroups.filter(group =>
                group.name.toLowerCase().includes(searchLower)
            );
        } else {
            filteredGroups = allGroups.filter(group => {
                const nameUpper = group.name.toUpperCase();
                return nameUpper.includes('TNG') || nameUpper.includes('ANG');
            });
        }

        return {
            success: true,
            data: filteredGroups,
            count: filteredGroups.length,
            totalCount: allGroups.length
        };
    }
}