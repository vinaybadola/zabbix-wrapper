import { Router } from "express";
import HostController from "../controllers/host.controller.js";
import { zabbixSessionMiddleware } from "../../middlewares/zabbix.session.middleware.js";
import DashboardController from "../controllers/dashboard.controller.js";
import UserController from "../controllers/user.controller.js";
import AuthController from "../controllers/auth.controller.js";
import UserGroupController from "../controllers/user.groups.controller.js";
import ZabbixService from "../services/zabbix.service.js";

const router = Router();

// Public routes
router.post("/login", AuthController.login);

// Protected routes (require auth)
router.use(zabbixSessionMiddleware);

router.post("/logout", AuthController.logout);
router.get("/roles", AuthController.getAllRoles);

// Host routes
router.get("/hosts", HostController.getHosts);
router.post("/hosts/create", HostController.createHost);
router.post("/host-groups", HostController.createHostGroup);
router.post("/host-groups/add-host", HostController.addHostToGroup);

// User routes
router.post("/user/submit", UserController.createClientUser);
router.get("/users", UserController.getAllUsers);
router.put("/user/modify", UserController.updateClientUser);
router.delete("/user/delete", UserController.deleteClientUser);

// User Group routes
router.get("/users/groups", UserGroupController.userGroups);
router.get("/hosts/groups", UserGroupController.hostGroups);
router.post("/user/groups/submit", UserGroupController.createClientUserGroup);
router.put("/user/groups/permissions", UserGroupController.updateUserGroupPermissions);
router.delete("/user/groups/:groupId/delete", UserGroupController.deleteUserGroup);

// Dashboard routes - UPDATED WITH NEW ROUTES
router.post("/dashboards/client-traffic", DashboardController.createClientTrafficDashboard);
router.post("/dashboards/multi-host", DashboardController.createMultiHostDashboard); // NEW
router.put("/dashboards/:dashboardId", DashboardController.updateClientTrafficDashboard);
router.get("/dashboards/debug", DashboardController.debugDashboardStructure);
router.get("/dashboards", DashboardController.getAllDashboards);
router.get("/dashboards/:dashboardId", DashboardController.getDashboardById);
router.get("/dashboards/:dashboardId/edit", DashboardController.getDashboardForEdit); // NEW
router.put("/dashboards/:dashboardId/update", DashboardController.updateDashboardWithItems); // NEW
router.delete("/dashboards/:dashboardId", DashboardController.deleteDashboard);
router.post("/dashboards/delete-multiple", DashboardController.deleteMultipleDashboards);
router.get("/dashboards/user/:userId", DashboardController.getUserDashboards); // NEW

// MOVE THESE ROUTES TO CONTROLLER METHODS - UPDATED
router.get('/hosts/:hostId/items', DashboardController.getHostItems); // NOW USING CONTROLLER
router.get('/hosts/groups/:groupId/hosts', DashboardController.getHostsByGroupId); // NOW USING CONTROLLER
router.get('/hosts/groups', DashboardController.getHostGroups); // NOW USING CONTROLLER
router.get('/users', DashboardController.getUsers); // NOW USING CONTROLLER

// Optional: Add route for searching items with more filters
router.get('/items/search', async (req, res, next) => {
    try {
        const { hostId, search, key } = req.query;
        
        const params = {
            output: ["itemid", "name", "key_", "value_type", "units"],
            sortfield: "name"
        };
        
        if (hostId) {
            params.hostids = hostId;
        }
        
        if (search) {
            params.search = {
                name: search
            };
        }
        
        if (key) {
            params.search = params.search || {};
            params.search.key_ = key;
        }
        
        const items = await ZabbixService.rpcCall({
            method: "item.get",
            params,
            authToken: req.zabbix.authToken
        });
        
        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        next(error);
    }
});

// Route for getting specific items by IDs
router.post('/items/by-ids', async (req, res, next) => {
    try {
        const { itemIds } = req.body;
        
        if (!itemIds || !Array.isArray(itemIds)) {
            return res.status(400).json({
                success: false,
                message: "itemIds array is required"
            });
        }
        
        const items = await ZabbixService.rpcCall({
            method: "item.get",
            params: {
                itemids: itemIds,
                output: ["itemid", "name", "key_", "hostid", "value_type", "units"]
            },
            authToken: req.zabbix.authToken
        });
        
        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        next(error);
    }
});

// Route for getting dashboard statistics
router.get('/dashboards/stats/summary', async (req, res, next) => {
    try {
        const dashboards = await ZabbixService.rpcCall({
            method: "dashboard.get",
            params: {
                output: ["dashboardid", "name", "userid", "private"],
                countOutput: true
            },
            authToken: req.zabbix.authToken
        });
        
        const users = await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                output: ["userid"],
                countOutput: true
            },
            authToken: req.zabbix.authToken
        });
        
        res.status(200).json({
            success: true,
            data: {
                totalDashboards: dashboards.length || 0,
                totalUsers: users.length || 0,
                publicDashboards: dashboards.filter(d => d.private === '0').length || 0,
                privateDashboards: dashboards.filter(d => d.private === '1').length || 0
            }
        });
    } catch (error) {
        next(error);
    }
});


router.get('/users/:userId/groups', async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        // First get user details
        const user = await ZabbixService.rpcCall({
            method: "user.get",
            params: {
                userids: userId,
                output: ["userid", "username"],
                selectUsrgrps: "extend"
            },
            authToken: req.zabbix.authToken
        });

        if (!user.length) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get user's groups
        const userGroups = user[0].usrgrps || [];
        
        // For each group, get host group permissions
        const groupsWithHosts = await Promise.all(
            userGroups.map(async (group) => {
                const groupDetails = await ZabbixService.rpcCall({
                    method: "usergroup.get",
                    params: {
                        usrgrpids: group.usrgrpid,
                        output: ["usrgrpid", "name"],
                        selectHostGroupRights: "extend"
                    },
                    authToken: req.zabbix.authToken
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

        res.status(200).json({
            success: true,
            data: groupsWithHosts
        });

    } catch (error) {
        next(error);
    }

}); 
export default router;