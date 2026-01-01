// UserGroupController.js
import ZabbixService from "../services/zabbix.service.js";

export default class UserGroupController {

    // ✅ Return groups WITH users
    static userGroups = async (req, res, next) => {
        try {
            const authToken = req.zabbix.authToken;

            // Fetch groups, users, AND host permissions in parallel
            const [groups, users] = await Promise.all([
                // IMPORTANT: Fetch groups WITH host permissions
                ZabbixService.rpcCall({
                    method: "usergroup.get",
                    params: {
                        output: ["usrgrpid", "name"],
                        selectUsers: ["userid", "username", "name", "surname"],
                        selectHostGroupRights: ["id", "permission"]  // <-- ADD THIS LINE
                    },
                    authToken
                }),
                ZabbixService.getUsersWithGroups({ authToken })
            ]);

            // console.log("📊 Total groups fetched:", groups.length);

            const data = groups.map(group => {
                // Get users in this group from the detailed group response
                const groupUsers = group.users || [];

                // Get host permissions for this group
                const hostPermissions = group.hostgroup_rights || [];
                const hostGroupIds = hostPermissions.map(h => h.id);

                console.log(`Group: ${group.name} (${group.usrgrpid})`);
                console.log(`- Users: ${groupUsers.length}`);
                console.log(`- Host Permissions: ${hostGroupIds.length}`);
                console.log(`- Host IDs: ${hostGroupIds.join(', ')}`);

                return {
                    usrgrpid: group.usrgrpid,
                    name: group.name,
                    users: groupUsers.map(u => ({
                        userid: u.userid,
                        username: u.username,
                        name: u.name || "",
                        surname: u.surname || "",
                        // You can add user's groups if needed
                        usrgrps: users.find(user => user.userid === u.userid)?.usrgrps || []
                    })),
                    hostPermissions: hostPermissions, // Add host permissions to response
                    hostGroupIds: hostGroupIds         // Just IDs for convenience
                };
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
            console.error("Error fetching user groups:", err.message);
            next(err);
        }
    };
    // ✅ Get Host Groups
    static hostGroups = async (req, res, next) => {
        try {
            const authToken = req.zabbix.authToken;
            const data = await ZabbixService.getHostGroups({ authToken });
            res.status(200).json({ success: true, message: "ok", data });
        } catch (err) {
            console.error("Error fetching host groups:", err.message);
            next(err);
        }
    };

    // ✅ Create Group + Permissions
    static createClientUserGroup = async (req, res, next) => {
        try {
            const { name, userIds, hostGroupIds } = req.body;

            // console.log("📦 ====== CREATE GROUP REQUEST ======");
            // console.log("Group Name:", name);
            // console.log("User IDs:", userIds);
            // console.log("Host Group IDs:", hostGroupIds);
            // console.log("Type of hostGroupIds:", typeof hostGroupIds);
            // console.log("Is array:", Array.isArray(hostGroupIds));
            // console.log("Length:", hostGroupIds?.length);

            if (!name || !Array.isArray(hostGroupIds)) {
                return res.status(400).json({
                    success: false,
                    message: "name and hostGroupIds[] required"
                });
            }

            // 1. Create the user group
            console.log("1. Creating user group...");
            const groupResult = await ZabbixService.createUserGroup({
                name,
                userIds,
                authToken: req.zabbix.authToken
            });

            console.log("Group creation result:", groupResult);
            const userGroupId = groupResult.usrgrpids?.[0];
            console.log("✅ User group created. ID:", userGroupId);

            if (!userGroupId) {
                throw new Error("Failed to get user group ID");
            }

            // 2. Set host group permissions
            console.log("2. Setting host group permissions...");
            console.log("Host Group IDs to set:", hostGroupIds);

            // Ensure all IDs are strings
            const stringHostGroupIds = hostGroupIds.map(id => String(id));
            console.log("Stringified host group IDs:", stringHostGroupIds);

            const permissionResult = await ZabbixService.setUserGroupPermissions({
                userGroupId,
                hostGroupIds: stringHostGroupIds,
                permission: 2, // READ permission
                authToken: req.zabbix.authToken
            });

            console.log("✅ Permissions set successfully:", permissionResult);
            console.log("====== REQUEST COMPLETE ======\n");

            res.status(201).json({
                success: true,
                data: {
                    groupId: userGroupId,
                    permissions: permissionResult
                }
            });
        } catch (err) {
            console.error("❌ Error creating client user group:", err.message);
            console.error("Error stack:", err.stack);
            next(err);
        }
    };

    // ✅ Update permissions
    static updateUserGroupPermissions = async (req, res, next) => {
        try {
            const { userGroupId, hostGroupIds } = req.body;
            if (!userGroupId || !Array.isArray(hostGroupIds)) {
                return res.status(400).json({ success: false, message: "userGroupId and hostGroupIds[] required" });
            }

            const result = await ZabbixService.setUserGroupPermissions({
                userGroupId,
                hostGroupIds,
                permission: 2,
                authToken: req.zabbix.authToken
            });

            res.status(200).json({ success: true, data: result });
        } catch (err) {
            console.error("Error updating user group permissions:", err.message);
            next(err);
        }
    };

    // ✅ Delete User Group (using same pattern as user delete)
    static deleteUserGroup = async (req, res, next) => {
        try {
            const { groupId } = req.params; // Get from URL params

            console.log("=== DELETE GROUP REQUEST ===");
            console.log("Group ID from params:", groupId);
            console.log("Request params:", req.params);

            if (!groupId) {
                return res.status(400).json({
                    success: false,
                    message: "Group ID is required"
                });
            }

            // Call Zabbix API
            const result = await ZabbixService.rpcCall({
                method: "usergroup.delete",
                params: [groupId],
                authToken: req.zabbix.authToken
            });

            console.log("✅ Delete successful:", result);

            return res.status(200).json({
                success: true,
                message: "Group deleted successfully",
                data: result
            });

        } catch (err) {
            console.error("❌ Delete error:", err.message);

            let errorMessage = "Failed to delete group";
            let statusCode = 500;

            if (err.message.includes("No permissions")) {
                errorMessage = "No permission to delete this group";
                statusCode = 403;
            } else if (err.message.includes("not exist") || err.message.includes("not found")) {
                errorMessage = "Group not found";
                statusCode = 404;
            } else if (err.message.includes("Cannot delete")) {
                errorMessage = "Cannot delete system group";
                statusCode = 400;
            }

            return res.status(statusCode).json({
                success: false,
                message: errorMessage
            });
        }
    };
};
