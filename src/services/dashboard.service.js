import ZabbixService from "./zabbix.service.js";

export default class DashboardService {

    static async createClientDashboard({
        dashboardName,
        userId,
        hostGroupIds,
        hostIds,
        itemIds,
        authToken
    }) {
        try {
            if (!authToken) {
                throw new Error("No auth token provided!");
            }
            if (!dashboardName || !userId || !hostIds || !itemIds) {
                throw new Error("Missing required parameters");
            }

            // Get host names
            const hostsResponse = await ZabbixService.rpcCall({
                method: "host.get",
                params: {
                    hostids: hostIds,
                    output: ["hostid", "name"]
                },
                authToken
            });

            if (!hostsResponse || hostsResponse.length === 0) {
                throw new Error("No hosts found");
            }

            // Get item details
            const itemsResponse = await ZabbixService.rpcCall({
                method: "item.get",
                params: {
                    itemids: itemIds,
                    output: ["itemid", "name", "key_", "hostid"]
                },
                authToken
            });

            if (!itemsResponse || itemsResponse.length === 0) {
                throw new Error("No items found");
            }

            // Create pages - one per host
            const pages = hostsResponse.map((host, index) => {
                const hostItems = itemsResponse.filter(item => item.hostid === host.hostid);

                // Create fields for svggraph widget
                const fields = [];


                // Host for the dataset
                fields.push({
                    type: 1,
                    name: "ds.0.hosts.0",
                    value: host?.name
                });

                // FIRST item in dataset
                fields.push({
                    type: 1,
                    name: "ds.0.items.0",
                    value: hostItems[0]?.name
                });

                // SECOND item in the SAME dataset
                fields.push({
                    type: 1,
                    name: "ds.0.items.1",
                    value: hostItems[1]?.name
                });

                // Color for first item line
                fields.push({
                    type: 1,
                    name: "ds.0.color.0",
                    value: "F4511E"
                });

                // Color for second item line
                fields.push({
                    type: 1,
                    name: "ds.0.color.1",
                    value: "FF5722"
                });

                // OR single color for all items
                fields.push({
                    type: 1,
                    name: "ds.0.color",
                    value: "FF5722" // Single color for all
                });

                fields.push({
                    type: 0, // INTEGER
                    name: "legend",
                    value: 1
                });

                fields.push({
                    type: 0, // INTEGER
                    name: "legend_statistic",
                    value: 1
                });



                // Widget title
                let widgetTitle;
                if (hostItems.length === 2) {
                    // Check if these are traffic items
                    const hasBitsIn = hostItems.some(item =>
                        item.name.toLowerCase().includes('bits') &&
                        item.name.toLowerCase().includes('received')
                    );
                    const hasBitsOut = hostItems.some(item =>
                        item.name.toLowerCase().includes('bits') &&
                        item.name.toLowerCase().includes('sent')
                    );

                    if (hasBitsIn && hasBitsOut) {
                        widgetTitle = "Traffic (Bits In/Out)";
                    } else {
                        widgetTitle = `${host.name} - ${hostItems.length} items`;
                    }
                } else {
                    widgetTitle = `${host.name} - ${hostItems.length} items`;
                }



                const widget = {
                    type: "svggraph",
                    name: widgetTitle,
                    x: 0,
                    y: 0,
                    width: 72,
                    height: 10,
                    fields: fields
                };

                return {
                    name: `Host: ${host.name}`,
                    widgets: [widget]
                };
            });

            // Create the dashboard
            const result = await ZabbixService.rpcCall({
                method: "dashboard.create",
                params: {
                    name: dashboardName,
                    userid: parseInt(userId),
                    private: 1,
                    pages: pages
                },
                authToken
            });

            return {
                success: true,
                dashboardId: result.dashboardids[0],
                dashboardName: dashboardName,
                message: `Dashboard created successfully with ${hostsResponse.length} host(s) and ${itemsResponse.length} item(s)`,
                details: {
                    hosts: hostsResponse.map(h => h.name),
                    totalItems: itemsResponse.length,
                    pages: pages.length
                }
            };

        } catch (error) {
            console.error("Error creating dashboard:", error);
            throw {
                statusCode: 500,
                message: `Dashboard creation failed: ${error.message}`
            };
        }
    }

    static async updateClientDashboard({
        dashboardId,
        dashboardName,
        hostIds,
        itemIds,
        authToken
    }) {
        try {
            if (!authToken) throw new Error("No auth token provided");
            if (!dashboardId || !dashboardName || !hostIds || !itemIds) {
                throw new Error("Missing required parameters");
            }

            /* ---------------------------
               1. Validate dashboard exists
            ----------------------------*/
            const existingDashboard = await ZabbixService.rpcCall({
                method: "dashboard.get",
                params: {
                    dashboardids: dashboardId,
                    output: ["dashboardid", "name"]
                },
                authToken
            });

            if (!existingDashboard || existingDashboard.length === 0) {
                throw new Error("Dashboard not found");
            }

            /* ---------------------------
               2. Fetch hosts
            ----------------------------*/
            const hostsResponse = await ZabbixService.rpcCall({
                method: "host.get",
                params: {
                    hostids: hostIds,
                    output: ["hostid", "name"]
                },
                authToken
            });

            if (!hostsResponse.length) throw new Error("No hosts found");

            /* ---------------------------
               3. Fetch items
            ----------------------------*/
            const itemsResponse = await ZabbixService.rpcCall({
                method: "item.get",
                params: {
                    itemids: itemIds,
                    output: ["itemid", "name", "key_", "hostid"]
                },
                authToken
            });

            if (!itemsResponse.length) throw new Error("No items found");

            /* ---------------------------
               4. Rebuild pages (same as create)
            ----------------------------*/
            const pages = hostsResponse.map(host => {
                const hostItems = itemsResponse.filter(
                    item => item.hostid === host.hostid
                );

                if (!hostItems.length) return null;

                const fields = [];

                // dataset host
                fields.push({
                    type: 1,
                    name: "ds.0.hosts.0",
                    value: host.name
                });

                // items
                hostItems.slice(0, 2).forEach((item, idx) => {
                    fields.push({
                        type: 1,
                        name: `ds.0.items.${idx}`,
                        value: item.name
                    });
                });

                // colors
                fields.push(
                    { type: 1, name: "ds.0.color.0", value: "F4511E" },
                    { type: 1, name: "ds.0.color.1", value: "FF5722" },
                    { type: 0, name: "legend", value: 1 },
                    { type: 0, name: "legend_statistic", value: 1 }
                );

                // widget title
                const hasIn = hostItems.some(i => i.key_.includes("net.if.in"));
                const hasOut = hostItems.some(i => i.key_.includes("net.if.out"));

                const widgetTitle =
                    hasIn && hasOut
                        ? "Traffic (Bits In / Out)"
                        : `${host.name} - ${hostItems.length} items`;

                return {
                    name: `Host: ${host.name}`,
                    widgets: [
                        {
                            type: "svggraph",
                            name: widgetTitle,
                            x: 0,
                            y: 0,
                            width: 72,
                            height: 10,
                            fields
                        }
                    ]
                };
            }).filter(Boolean);

            /* ---------------------------
               5. Update dashboard (FULL overwrite)
            ----------------------------*/
            const result = await ZabbixService.rpcCall({
                method: "dashboard.update",
                params: {
                    dashboardid: dashboardId,
                    name: dashboardName,
                    pages
                },
                authToken
            });

            return {
                success: true,
                dashboardId,
                message: "Dashboard updated successfully",
                details: {
                    hosts: hostsResponse.map(h => h.name),
                    totalItems: itemsResponse.length,
                    pages: pages.length
                }
            };

        } catch (error) {
            console.error("Error updating dashboard:", error);
            throw {
                statusCode: 500,
                message: `Dashboard update failed: ${error.message}`
            };
        }
    }
}