import ZabbixService from "./zabbix.service.js";

export default class ZabbixDashboardService {

    /**
     * Create traffic dashboard for a client
     */
    static async createClientTrafficDashboard({
        clientUserId,
        hostGroupId,
        dashboardName,
        authToken
    }) {
        if (!clientUserId || !hostGroupId) {
            throw new Error("clientUserId and hostGroupId are required");
        }

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

        const hostId = "10889";

        const items = await ZabbixService.rpcCall({
            method: "item.get",
            params: {
                hostids: hostId,
                search: { name: "Bits" },
                output: ["itemid", "name", "key_"]
            },
            authToken
        });

        const bitsIn = items.find(i => {
            const name = i.name.toLowerCase();
            return name.includes("bits received") &&
                name.includes("100ge0/0/1") &&
                name.includes("backbone");
        });

        const bitsOut = items.find(i => {
            const name = i.name.toLowerCase();
            return name.includes("bits sent") &&
                name.includes("100ge0/0/1") &&
                name.includes("backbone");
        });

        if (!bitsIn || !bitsOut) {
            throw new Error("Traffic items (Bits in/out) not found");
        }

        console.log('Creating dashboard with items:', {
            hostId,
            bitsIn: { id: bitsIn.itemid, name: bitsIn.name },
            bitsOut: { id: bitsOut.itemid, name: bitsOut.name }
        });

        const result = await ZabbixService.rpcCall({
            method: "dashboard.create",
            params: {
                name: dashboardName || `Traffic Dashboard - 10.156.252.3`,
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
                                    // ✅ ONE dataset (ds.0) with ONE host
                                    {
                                        type: 1,
                                        name: "ds.0.hosts.0",
                                        value: "10.156.252.3"
                                    },
                                    // ✅ First item - Bits In
                                    {
                                        type: 1,
                                        name: "ds.0.items.0",
                                        value: bitsIn.name
                                    },
                                    // ✅ Second item - Bits Out
                                    {
                                        type: 1,
                                        name: "ds.0.items.1",
                                        value: bitsOut.name
                                    },
                                    // ✅ Color for the dataset
                                    {
                                        type: 1,
                                        name: "ds.0.color",
                                        value: "1A7C11"
                                    },
                                    // ✅ Y-axis position
                                    {
                                        type: 0,
                                        name: "righty",
                                        value: 0
                                    },
                                    // Optional: Legend settings
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
            dashboardId: result.dashboardids[0],
            host: "10.156.252.3",
            items: {
                bitsReceived: bitsIn.name,
                bitsSent: bitsOut.name
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

        // First, get the existing dashboard to preserve other settings
        const existingDashboard = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params: {
                dashboardids: dashboardId,
                output: "extend",
                selectPages: "extend",
                selectWidgets: "extend",
                selectWidgetFields: "extend"
            },
            authToken
        });

        if (!existingDashboard.length) {
            throw new Error("Dashboard not found");
        }

        // If new host group provided, fetch new items
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

        // Build the update params
        const updateParams = {
            dashboardid: dashboardId
        };

        // Update name if provided
        if (dashboardName) {
            updateParams.name = dashboardName;
        }

        // Update userid if provided
        if (clientUserId) {
            updateParams.userid = parseInt(clientUserId);
        }

        // Update pages if new items found
        if (bitsIn && bitsOut) {
            updateParams.pages = [
                {
                    dashboard_pageid: existingDashboard[0].pages[0].dashboard_pageid,
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
            ];
        }

        const result = await ZabbixService.rpcCall({
            method: "dashboard.update",
            params: updateParams,
            authToken
        });

        return {
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
                    output: "extend",
                    selectPages: "extend"
                },
                authToken
            });

            console.log('Total dashboards:', dashboards.length);

            // If using Zabbix 6.0+, try the original parameter
            if (dashboards.length > 0 && dashboards[0].pages) {
                console.log('Dashboard pages structure:', JSON.stringify(dashboards[6].pages[0], null, 2));
            }

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

        // Filter by user if provided
        if (clientUserId) {
            params.userids = clientUserId;
        }

        // Include pages and widgets if needed
        if (includeWidgets) {
            params.selectPages = "extend";
            params.selectWidgets = "extend";
            params.selectWidgetFields = "extend";
        }

        const dashboards = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params,
            authToken
        });

        // Format the response
        return dashboards.map(dashboard => ({
            dashboardId: dashboard.dashboardid,
            name: dashboard.name,
            userId: dashboard.userid,
            private: dashboard.private,
            pages: dashboard.pages?.map(page => ({
                pageId: page.dashboard_pageid,
                name: page.name,
                widgets: page.widgets?.map(widget => ({
                    widgetId: widget.widgetid,
                    type: widget.type,
                    name: widget.name,
                    x: widget.x,
                    y: widget.y,
                    width: widget.width,
                    height: widget.height,
                    fields: widget.fields
                }))
            }))
        }));
    }

    static async getDashboardById({
        dashboardId,
        authToken
    }) {
        if (!dashboardId) {
            throw new Error("dashboardId is required");
        }

        const dashboards = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params: {
                dashboardids: dashboardId,
                output: "extend",
                selectPages: "extend",
                selectWidgets: "extend",
                selectWidgetFields: "extend"
            },
            authToken
        });

        if (!dashboards.length) {
            throw new Error("Dashboard not found");
        }

        const dashboard = dashboards[0];

        return {
            dashboardId: dashboard.dashboardid,
            name: dashboard.name,
            userId: dashboard.userid,
            private: dashboard.private,
            pages: dashboard.pages?.map(page => ({
                pageId: page.dashboard_pageid,
                name: page.name,
                widgets: page.widgets?.map(widget => ({
                    widgetId: widget.widgetid,
                    type: widget.type,
                    name: widget.name,
                    x: widget.x,
                    y: widget.y,
                    width: widget.width,
                    height: widget.height,
                    fields: widget.fields
                }))
            }))
        };
    }

    static async deleteDashboard({
        dashboardId,
        authToken
    }) {
        if (!dashboardId) {
            throw new Error("dashboardId is required");
        }

        // Check if dashboard exists first
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
            deleted: true,
            dashboardIds: result.dashboardids,
            count: result.dashboardids.length,
            message: `${result.dashboardids.length} dashboard(s) deleted successfully`
        };
    }
}
