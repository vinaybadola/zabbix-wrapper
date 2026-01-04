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

            return dashboards;
        } catch (error) {
            console.error('Error debugging dashboard structure:', error);
            return null;
        }
    }

    static async getAllDashboards({
        authToken,
        clientUserId = null,
        includeWidgets = true,
        search = null
    }) {
        const params = {
            output: ["dashboardid", "name", "userid", "private"]
        };

        if (clientUserId) {
            params.userids = clientUserId;
        }

        if (search) {
            params.search = { name: search };
            params.searchWildcardsEnabled = true;
        }
        params.sortfield = "dashboardid"
        params.sortorder = "DESC"

        const dashboards = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params,
            authToken
        });

        if (!dashboards.length) return [];

        const userIds = [
            ...new Set(dashboards.map(d => d.userid).filter(Boolean))
        ];

        const users = await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                userids: userIds,
                output: ["userid", "username", "name", "surname"],
            },
            authToken
        });

        const userIdToName = new Map(
            users.map(u => [
                u.userid,
                u.username || `${u.name || ""} ${u.surname || ""}`.trim()
            ])
        );

        return dashboards.map(dashboard => ({
            dashboardId: dashboard.dashboardid,
            name: dashboard.name,
            userId: dashboard.userid,
            userName: userIdToName.get(dashboard.userid) || "Unknown",
            private: Number(dashboard.private)
        }));
    }

    static async getDashboardInfraData({
        dashboardId,
        authToken
    }) {
        if (!dashboardId) {
            throw new Error("dashboardId is required");
        }

        /* ─────────────────────────────
           1️⃣ GET DASHBOARD WITH PAGES
        ───────────────────────────── */
        const dashboards = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params: {
                dashboardids: dashboardId,
                output: "extend",
                selectPages: ["dashboard_pageid", "name", "widgets"]
            },
            authToken
        });

        if (!dashboards.length) {
            throw new Error("Dashboard not found");
        }

        const dashboard = dashboards[0];

        /* ─────────────────────────────
           2️⃣ EXTRACT HOST REFERENCES FROM WIDGETS
        ───────────────────────────── */
        const hostReferences = new Set();
        const itemReferences = new Set();
        let allWidgets = [];

        if (dashboard.pages && Array.isArray(dashboard.pages)) {
            dashboard.pages.forEach(page => {
                if (page.widgets && Array.isArray(page.widgets)) {
                    allWidgets = [...allWidgets, ...page.widgets];
                    page.widgets.forEach(widget => {
                        this.extractReferencesFromWidget(widget, hostReferences, itemReferences);
                    });
                }
            });
        }

        console.log("Host references found:", Array.from(hostReferences));
        console.log("Item references found:", Array.from(itemReferences));

        /* ─────────────────────────────
           3️⃣ CONVERT HOST REFERENCES TO HOST IDs WITH GROUPS
        ───────────────────────────── */
        let hostIdMap = new Map();
        let itemIdMap = new Map();
        let hostGroupIds = new Set();

        // Convert host references to host IDs WITH GROUPS
        if (hostReferences.size > 0) {
            const hosts = await ZabbixService.rpcCall({
                method: "host.get",
                params: {
                    filter: {
                        host: Array.from(hostReferences)
                    },
                    output: ["hostid", "name", "host", "status"],
                    selectInterfaces: ["ip", "dns", "useip"],
                    selectGroups: ["groupid", "name"], // 🔥 GET HOST GROUPS
                    sortfield: "name"
                },
                authToken
            });

            // Create mapping and collect host group IDs
            hosts.forEach(host => {
                // Map by hostname
                hostIdMap.set(host.host, host);
                // Map by IP
                if (host.interfaces && host.interfaces.length > 0) {
                    const primaryInterface = host.interfaces[0];
                    if (primaryInterface.ip) hostIdMap.set(primaryInterface.ip, host);
                    if (primaryInterface.dns) hostIdMap.set(primaryInterface.dns, host);
                }

                // Collect host group IDs
                if (host.groups && Array.isArray(host.groups)) {
                    host.groups.forEach(group => {
                        hostGroupIds.add(group.groupid);
                    });
                }
            });
        }

        /* ─────────────────────────────
           4️⃣ GET ITEM IDs USING MULTIPLE METHODS
        ───────────────────────────── */
        if (itemReferences.size > 0 && hostIdMap.size > 0) {
            const hostIds = Array.from(hostIdMap.values()).map(h => h.hostid);

            // Get ALL items for the hosts and match locally
            const allHostItems = await ZabbixService.rpcCall({
                method: "item.get",
                params: {
                    hostids: hostIds,
                    output: ["itemid", "name", "key_", "hostid"],
                    selectHosts: ["hostid", "name"],
                    sortfield: "name"
                },
                authToken
            });

            console.log(`Total items found for hosts: ${allHostItems.length}`);

            // Smart matching for Zabbix item names
            Array.from(itemReferences).forEach(itemName => {
                console.log(`Looking for: "${itemName}"`);

                // Try different matching strategies
                const matches = allHostItems.filter(item => {
                    const itemNameLower = item.name.toLowerCase();
                    const searchNameLower = itemName.toLowerCase();

                    // Strategy 1: Exact match
                    if (itemNameLower === searchNameLower) return true;

                    // Strategy 2: Contains match
                    if (itemNameLower.includes(searchNameLower) ||
                        searchNameLower.includes(itemNameLower)) return true;

                    // Strategy 3: Clean special chars and match
                    const cleanItemName = itemNameLower.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
                    const cleanSearchName = searchNameLower.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');

                    if (cleanItemName.includes(cleanSearchName) ||
                        cleanSearchName.includes(cleanItemName)) return true;

                    // Strategy 4: Match key parts
                    const itemWords = cleanItemName.split(' ');
                    const searchWords = cleanSearchName.split(' ');

                    const matchingWords = searchWords.filter(word =>
                        word.length > 3 && itemWords.includes(word)
                    );

                    return matchingWords.length >= Math.min(2, searchWords.length);
                });

                if (matches.length > 0) {
                    console.log(`Found ${matches.length} match(es) for "${itemName}":`);
                    matches.forEach(match => {
                        console.log(`  ${match.itemid}: ${match.name}`);
                        itemIdMap.set(itemName, match); // Map original name to item
                    });
                } else {
                    console.log(`No match found for: "${itemName}"`);
                }
            });
        }

        /* ─────────────────────────────
           5️⃣ GET HOST GROUPS INFO (if needed)
        ───────────────────────────── */
        let hostGroups = [];
        if (hostGroupIds.size > 0) {
            const groups = await ZabbixService.rpcCall({
                method: "hostgroup.get",
                params: {
                    groupids: Array.from(hostGroupIds),
                    output: ["groupid", "name"],
                    sortfield: "name"
                },
                authToken
            });
            hostGroups = groups;
        }

        /* ─────────────────────────────
           6️⃣ RECONSTRUCT WIDGET DATA WITH IDs
        ───────────────────────────── */
        const widgetsWithIds = [];

        if (dashboard.pages && Array.isArray(dashboard.pages)) {
            dashboard.pages.forEach(page => {
                if (page.widgets && Array.isArray(page.widgets)) {
                    page.widgets.forEach(widget => {
                        const reconstructedWidget = this.reconstructWidgetWithIds(widget, hostIdMap, itemIdMap);
                        widgetsWithIds.push(reconstructedWidget);
                    });
                }
            });
        }

        /* ─────────────────────────────
           7️⃣ GET OWNER INFO
        ───────────────────────────── */
        const ownerUserId = dashboard.userid;

        const users = await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                userids: ownerUserId,
                output: ["userid", "username", "name", "surname"]
            },
            authToken
        });

        const user = users[0] || null;

        /* ─────────────────────────────
           8️⃣ GET USER'S HOST GROUP RIGHTS (for edit form)
        ───────────────────────────── */
        const userGroups = await ZabbixService.rpcCall({
            method: "usergroup.get",
            params: {
                userids: ownerUserId,
                output: ["usrgrpid", "name"],
                selectHostGroupRights: ["id", "permission", "name"]
            },
            authToken
        });

        const allowedHostGroupIds = new Set();
        const allowedHostGroups = [];

        for (const group of userGroups) {
            for (const right of group.hostgroup_rights || []) {
                if (Number(right.permission) >= 2) {
                    allowedHostGroupIds.add(String(right.id));
                    allowedHostGroups.push({
                        groupid: right.id,
                        name: right.name || `Group ${right.id}`
                    });
                }
            }
        }

        return {
            dashboard: {
                dashboardid: dashboard.dashboardid,
                name: dashboard.name,
                ownerUserId,
                pageCount: dashboard.pages ? dashboard.pages.length : 0,
                totalWidgets: allWidgets.length
            },
            user,
            // Hosts with IDs and Groups
            hosts: Array.from(hostIdMap.values()).map(host => ({
                hostid: host.hostid,
                name: host.name,
                host: host.host,
                ip: host.interfaces?.[0]?.ip || null,
                status: host.status,
                groups: host.groups || [] // Includes group IDs
            })),
            // Items with IDs
            items: Array.from(itemIdMap.values()).map(item => ({
                itemid: item.itemid,
                name: item.name,
                key_: item.key_,
                hostid: item.hostid,
                hostName: item.hosts?.[0]?.name || ""
            })),
            // Host groups from dashboard hosts
            hostGroups: hostGroups.map(group => ({
                groupid: group.groupid,
                name: group.name
            })),
            // User's allowed host groups (for dropdown in edit form)
            allowedHostGroups,
            // Widget structure with IDs for edit form
            widgets: widgetsWithIds,
            // For backward compatibility
            selectedHostsFromWidgets: Array.from(hostIdMap.values()),
            extractedHostIds: Array.from(hostIdMap.values()).map(h => h.hostid),
            // For your edit form payload
            hostGroupIds: Array.from(hostGroupIds),
            hostIds: Array.from(hostIdMap.values()).map(h => h.hostid),
            itemIds: Array.from(itemIdMap.values()).map(i => i.itemid)
        };
    }

    /* ─────────────────────────────
       HELPER: Extract references from widget
    ───────────────────────────── */
    static extractReferencesFromWidget(widget, hostRefs, itemRefs) {
        if (!widget.fields || !Array.isArray(widget.fields)) return;

        widget.fields.forEach(field => {
            // Look for host references (ds.0.hosts.0 pattern)
            if (field.name && field.name.startsWith('ds.') && field.name.includes('.hosts.')) {
                if (field.value && typeof field.value === 'string') {
                    console.log(`Found host reference in ${field.name}: ${field.value}`);
                    hostRefs.add(field.value);
                }
            }

            // Look for item references (ds.0.items.0 pattern)
            if (field.name && field.name.startsWith('ds.') && field.name.includes('.items.')) {
                if (field.value && typeof field.value === 'string') {
                    console.log(`Found item reference in ${field.name}: ${field.value}`);
                    itemRefs.add(field.value);
                }
            }

            // Also check page name for host reference (your example shows "Host: 10.156.252.3")
            if (field.name === 'name' && field.value && field.value.includes('Host:')) {
                const hostMatch = field.value.match(/Host:\s*([^\s]+)/);
                if (hostMatch && hostMatch[1]) {
                    console.log(`Found host reference in page name: ${hostMatch[1]}`);
                    hostRefs.add(hostMatch[1]);
                }
            }
        });
    }

    /* ─────────────────────────────
       HELPER: Reconstruct widget with IDs
    ───────────────────────────── */
    static reconstructWidgetWithIds(widget, hostIdMap, itemIdMap) {
        const reconstructed = {
            widgetid: widget.widgetid,
            type: widget.type,
            name: widget.name,
            fields: []
        };

        if (widget.fields && Array.isArray(widget.fields)) {
            widget.fields.forEach(field => {
                const newField = { ...field };

                // Replace host references with IDs
                if (field.name && field.name.startsWith('ds.') && field.name.includes('.hosts.')) {
                    if (field.value && hostIdMap.has(field.value)) {
                        const host = hostIdMap.get(field.value);
                        // Store both original value and ID for edit form
                        newField.original_value = field.value;
                        newField.value = host.hostid;
                        newField.host_info = {
                            hostid: host.hostid,
                            name: host.name,
                            host: host.host
                        };
                    }
                }

                // Replace item references with IDs
                if (field.name && field.name.startsWith('ds.') && field.name.includes('.items.')) {
                    if (field.value && itemIdMap.has(field.value)) {
                        const item = itemIdMap.get(field.value);
                        newField.original_value = field.value;
                        newField.value = item.itemid;
                        newField.item_info = {
                            itemid: item.itemid,
                            name: item.name,
                            key_: item.key_
                        };
                    }
                }

                reconstructed.fields.push(newField);
            });
        }

        return reconstructed;
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
}