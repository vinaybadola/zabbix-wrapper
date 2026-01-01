import ZabbixService from "./zabbix.service.js";

export default class ZabbixDashboardService {

    static async createClientTrafficDashboard({
        clientUserId,
        hostGroupId,
        dashboardName,
        bitsInItemId,
        bitsOutItemId,
        authToken
    }) {
        if (!clientUserId || !hostGroupId) {
            throw new Error("clientUserId and hostGroupId are required");
        }

        let bitsIn, bitsOut;
        let finalHostId;

        if (bitsInItemId && bitsOutItemId) {
            // Use provided item IDs
            const items = await ZabbixService.rpcCall({
                method: "item.get",
                params: {
                    itemids: [bitsInItemId, bitsOutItemId],
                    output: ["itemid", "name", "key_", "hostid"]
                },
                authToken
            });

            bitsIn = items.find(i => i.itemid === bitsInItemId);
            bitsOut = items.find(i => i.itemid === bitsOutItemId);

            if (!bitsIn || !bitsOut) {
                throw new Error("One or both item IDs not found");
            }

            finalHostId = bitsIn.hostid;
        } else {
            // Original logic
            const hosts = await ZabbixService.rpcCall({
                method: "host.get",
                params: {
                    groupids: hostGroupId,
                    output: ["hostid", "name"]
                },
                authToken
            });

            if (!hosts.length) {
                throw new Error("No hosts found in host group");
            }

            finalHostId = hosts[0].hostid;
            const hostName = hosts[0].name;

            const items = await ZabbixService.rpcCall({
                method: "item.get",
                params: {
                    hostids: finalHostId,
                    search: { name: "Bits" },
                    output: ["itemid", "name", "key_"]
                },
                authToken
            });

            bitsIn = items.find(i => {
                const name = i.name.toLowerCase();
                return name.includes("bits received") &&
                    name.includes("100ge0/0/1") &&
                    name.includes("backbone");
            });

            bitsOut = items.find(i => {
                const name = i.name.toLowerCase();
                return name.includes("bits sent") &&
                    name.includes("100ge0/0/1") &&
                    name.includes("backbone");
            });

            if (!bitsIn || !bitsOut) {
                throw new Error("Traffic items (Bits in/out) not found");
            }
        }

        // Get host name for dashboard
        const hostInfo = await ZabbixService.rpcCall({
            method: "host.get",
            params: {
                hostids: finalHostId,
                output: ["name"]
            },
            authToken
        });

        const hostName = hostInfo[0]?.name || finalHostId;

        // Rest of the dashboard creation code...
        const result = await ZabbixService.rpcCall({
            method: "dashboard.create",
            params: {
                name: dashboardName || `Traffic Dashboard - ${hostName}`,
                userid: parseInt(clientUserId),
                private: 0,
                pages: [
                    {
                        name: "Traffic Overview",
                        widgets: [
                            {
                                type: "svggraph",
                                name: "Traffic (Bits In/Out)",
                                x: 0,
                                y: 0,
                                width: 24,
                                height: 8,
                                fields: [
                                    {
                                        type: 1,
                                        name: "ds.0.hosts.0",
                                        value: hostName
                                    },
                                    {
                                        type: 1,
                                        name: "ds.0.items.0",
                                        value: bitsIn.name
                                    },
                                    {
                                        type: 1,
                                        name: "ds.0.items.1",
                                        value: bitsOut.name
                                    },
                                    {
                                        type: 1,
                                        name: "ds.0.color",
                                        value: "1A7C11"
                                    },
                                    {
                                        type: 0,
                                        name: "righty",
                                        value: 0
                                    },
                                    {
                                        type: 0,
                                        name: "legend",
                                        value: 1
                                    },
                                    {
                                        type: 0,
                                        name: "legend_statistic",
                                        value: 1
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            authToken
        });

        return {
            success: true,
            dashboardId: result.dashboardids[0],
            host: hostName,
            items: {
                bitsReceived: {
                    itemid: bitsIn.itemid,
                    name: bitsIn.name,
                    key: bitsIn.key_
                },
                bitsSent: {
                    itemid: bitsOut.itemid,
                    name: bitsOut.name,
                    key: bitsOut.key_
                }
            }
        };
    }

    static async updateClientTrafficDashboard({
        dashboardId,
        clientUserId,
        hostGroupId,
        dashboardName,
        authToken
    }) {
        if (!dashboardId) {
            throw new Error("dashboardId is required");
        }

        // Get existing dashboard WITHOUT complex parameters
        const existingDashboard = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params: {
                dashboardids: dashboardId,
                output: "extend"
            },
            authToken
        });

        if (!existingDashboard.length) {
            throw new Error("Dashboard not found");
        }

        let bitsIn, bitsOut, hostName;

        if (hostGroupId) {
            const hosts = await ZabbixService.rpcCall({
                method: "host.get",
                params: {
                    groupids: hostGroupId,
                    output: ["hostid", "name"]
                },
                authToken
            });

            if (!hosts.length) {
                throw new Error("No hosts found in host group");
            }

            const hostId = hosts[0].hostid;
            hostName = hosts[0].name;

            const items = await ZabbixService.rpcCall({
                method: "item.get",
                params: {
                    hostids: hostId,
                    search: { name: "Bits" },
                    output: ["itemid", "name", "key_"]
                },
                authToken
            });

            bitsIn = items.find(i => {
                const name = i.name.toLowerCase();
                return name.includes("bits received") &&
                    name.includes("100ge0/0/1") &&
                    name.includes("backbone");
            });

            bitsOut = items.find(i => {
                const name = i.name.toLowerCase();
                return name.includes("bits sent") &&
                    name.includes("100ge0/0/1") &&
                    name.includes("backbone");
            });

            if (!bitsIn || !bitsOut) {
                throw new Error("Traffic items (Bits in/out) not found");
            }
        }

        const updateParams = {
            dashboardid: dashboardId
        };

        if (dashboardName) {
            updateParams.name = dashboardName;
        }

        if (clientUserId) {
            updateParams.userid = parseInt(clientUserId);
        }

        const result = await ZabbixService.rpcCall({
            method: "dashboard.update",
            params: updateParams,
            authToken
        });

        return {
            success: true,
            dashboardId: result.dashboardids[0],
            updated: true,
            ...(bitsIn && bitsOut && {
                host: hostName,
                items: {
                    bitsReceived: bitsIn.name,
                    bitsSent: bitsOut.name
                }
            })
        };
    }

    static async debugDashboardStructure({ authToken }) {
        try {
            const dashboards = await ZabbixService.rpcCall({
                method: "dashboard.get",
                params: {
                    output: "extend"
                },
                authToken
            });

            console.log('Total dashboards:', dashboards.length);
            return dashboards;
        } catch (error) {
            console.error('Error debugging dashboard structure:', error);
            return null;
        }
    }

    static async getAllDashboards({
        authToken,
        clientUserId = null,
        includeWidgets = true
    }) {
        const params = {
            output: "extend"
        };

        if (clientUserId) {
            params.userids = clientUserId;
        }

        const dashboards = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params,
            authToken
        });

        return dashboards.map(dashboard => ({
            dashboardId: dashboard.dashboardid,
            name: dashboard.name,
            userId: dashboard.userid,
            private: dashboard.private
        }));
    }

    static async getDashboardById({
        dashboardId,
        authToken
    }) {
        if (!dashboardId) {
            throw new Error("dashboardId is required");
        }

        // SIMPLE CALL WITHOUT COMPLEX PARAMETERS
        const dashboards = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params: {
                dashboardids: dashboardId,
                output: "extend"
            },
            authToken
        });

        if (!dashboards.length) {
            throw new Error("Dashboard not found");
        }

        const dashboard = dashboards[0];

        return {
            success: true,
            dashboardId: dashboard.dashboardid,
            name: dashboard.name,
            userId: dashboard.userid,
            private: dashboard.private
        };
    }

    static async deleteDashboard({
        dashboardId,
        authToken
    }) {
        if (!dashboardId) {
            throw new Error("dashboardId is required");
        }

        const existingDashboard = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params: {
                dashboardids: dashboardId,
                output: ["dashboardid", "name"]
            },
            authToken
        });

        if (!existingDashboard.length) {
            throw new Error("Dashboard not found");
        }

        const result = await ZabbixService.rpcCall({
            method: "dashboard.delete",
            params: [dashboardId],
            authToken
        });

        return {
            success: true,
            deleted: true,
            dashboardId: result.dashboardids[0],
            message: `Dashboard "${existingDashboard[0].name}" deleted successfully`
        };
    }

    static async deleteMultipleDashboards({
        dashboardIds,
        authToken
    }) {
        if (!dashboardIds || !dashboardIds.length) {
            throw new Error("dashboardIds array is required");
        }

        const result = await ZabbixService.rpcCall({
            method: "dashboard.delete",
            params: dashboardIds,
            authToken
        });

        return {
            success: true,
            deleted: true,
            dashboardIds: result.dashboardids,
            count: result.dashboardids.length,
            message: `${result.dashboardids.length} dashboard(s) deleted successfully`
        };
    }

    static async getHostItems({
        hostId,
        search = "",
        authToken
    }) {
        if (!hostId) {
            throw new Error("hostId is required");
        }

        const params = {
            hostids: hostId,
            output: ["itemid", "name", "key_", "value_type", "units"],
            sortfield: "name"
        };

        if (search) {
            params.search = {
                name: search
            };
        }

        const items = await ZabbixService.rpcCall({
            method: "item.get",
            params,
            authToken
        });

        return {
            success: true,
            data: items
        };
    }

    static async getHostsByGroupId({
        groupId,
        authToken
    }) {
        if (!groupId) {
            throw new Error("groupId is required");
        }

        const hosts = await ZabbixService.rpcCall({
            method: "host.get",
            params: {
                groupids: groupId,
                output: ["hostid", "host", "name", "status"],
                selectInterfaces: ["ip"]
            },
            authToken
        });

        return {
            success: true,
            data: hosts
        };
    }

    static async getUsers({ authToken }) {
        const users = await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                output: ["userid", "username", "name", "surname"],
                getAccess: true
            },
            authToken
        });

        return {
            success: true,
            data: users
        };
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

    // NEW: Create Multi-Host Dashboard
    static async createMultiHostDashboard({
        clientUserId,
        hostGroupId,
        dashboardName,
        hostsData,
        authToken
    }) {
        console.log('Creating multi-host dashboard:', {
            clientUserId,
            hostGroupId,
            dashboardName,
            hostsData
        });

        if (!clientUserId || !hostGroupId || !hostsData) {
            throw new Error("clientUserId, hostGroupId and hostsData are required");
        }

        const hostIds = Object.keys(hostsData);
        if (hostIds.length === 0) {
            throw new Error("No hosts selected");
        }

        // Get all item IDs
        const allItemIds = [];
        Object.values(hostsData).forEach(itemIds => {
            allItemIds.push(...itemIds);
        });

        if (allItemIds.length === 0) {
            throw new Error("No items selected for dashboard");
        }

        // Get host details
        const hosts = await ZabbixService.rpcCall({
            method: "host.get",
            params: {
                hostids: hostIds,
                output: ["hostid", "name", "host"]
            },
            authToken
        });

        if (hosts.length === 0) {
            throw new Error("Selected hosts not found");
        }

        // Get all items details
        const items = await ZabbixService.rpcCall({
            method: "item.get",
            params: {
                itemids: allItemIds,
                output: ["itemid", "name", "key_", "hostid"]
            },
            authToken
        });

        // Create widgets for each host
        const widgets = [];
        let yPosition = 0;
        const widgetHeight = 8;

        for (const host of hosts) {
            const hostItemIds = hostsData[host.hostid] || [];
            const hostItems = items.filter(item => 
                hostItemIds.includes(item.itemid) && item.hostid === host.hostid
            );
            
            if (hostItems.length === 0) {
                console.warn(`No items found for host ${host.hostid}, skipping widget`);
                continue;
            }

            const hostName = host.name || host.host || `Host ${host.hostid}`;
            const widgetName = `Traffic - ${hostName}`;
            
            // Take first two items for this widget (for simplicity)
            const widgetItems = hostItems.slice(0, 2);
            
            const fields = [
                {
                    type: 1,
                    name: "ds.0.hosts.0",
                    value: hostName
                },
                {
                    type: 1,
                    name: "ds.0.items.0",
                    value: widgetItems[0]?.name || "Item 1"
                },
                {
                    type: 1,
                    name: "ds.0.items.1",
                    value: widgetItems[1]?.name || "Item 2"
                },
                {
                    type: 1,
                    name: "ds.0.color",
                    value: "1A7C11"
                },
                {
                    type: 0,
                    name: "righty",
                    value: 0
                },
                {
                    type: 0,
                    name: "legend",
                    value: 1
                },
                {
                    type: 0,
                    name: "legend_statistic",
                    value: 1
                }
            ];

            widgets.push({
                type: "svggraph",
                name: widgetName,
                x: 0,
                y: yPosition,
                width: 24,
                height: widgetHeight,
                fields: fields
            });

            yPosition += widgetHeight;
        }

        if (widgets.length === 0) {
            throw new Error("No widgets created. Check if items exist for selected hosts.");
        }

        // Create the dashboard
        const result = await ZabbixService.rpcCall({
            method: "dashboard.create",
            params: {
                name: dashboardName || `Multi-Host Dashboard - ${hosts.length} Hosts`,
                userid: parseInt(clientUserId),
                private: 0,
                pages: [
                    {
                        name: "Traffic Overview",
                        widgets: widgets
                    }
                ]
            },
            authToken
        });

        return {
            success: true,
            dashboardId: result.dashboardids[0],
            hostCount: hosts.length,
            widgetCount: widgets.length,
            totalItems: allItemIds.length,
            message: `Dashboard created with ${widgets.length} widgets for ${hosts.length} hosts`
        };
    }
}