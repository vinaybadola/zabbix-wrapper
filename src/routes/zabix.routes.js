import { Router } from "express";
import HostController from "../controllers/host.controller.js";
import { zabbixSessionMiddleware } from "../../middlewares/zabbix.session.middleware.js";
import DashboardController from "../controllers/dashboard.controller.js";
import UserController from "../controllers/user.controller.js";
import AuthController from "../controllers/auth.controller.js";
import UserGroupController from "../controllers/user.groups.controller.js";

const router = Router();

// Public routes
router.post("/login", AuthController.login);

// Protected routes (require auth)
router.use(zabbixSessionMiddleware);

router.get("/logout", AuthController.logout);
router.get("/me", AuthController.me);
router.post("/auth/password/reset", AuthController.changeClientPassword);
router.get("/roles", AuthController.getAllRoles);

// Host routes
router.get("/hosts", HostController.getHosts);
router.post("/hosts/create", HostController.createHost);
router.post("/host-groups", HostController.createHostGroup);
router.post("/host-groups/add-host", HostController.addHostToGroup);
router.post("/hosts/by-host-groups", HostController.fetchHostFromHostGroups);
router.post("/hosts/items", HostController.fetchHostItems);
router.get("/hosts/groups", HostController.fetchHostGroups);

// User routes
router.post("/user/submit", UserController.createClientUser);
router.get("/users", UserController.getAllUsers);
router.post("/users/host-groups", UserController.getUserHostGroups);
router.put("/user/modify", UserController.updateClientUser);
router.delete("/user/delete", UserController.deleteClientUser);

// User Group routes
router.get("/users/groups", UserGroupController.userGroups);
router.post("/user/groups/submit", UserGroupController.createClientUserGroup);
router.put("/user/group/modify", UserGroupController.updateUserGroup);
router.put("/user/groups/permissions", UserGroupController.updateUserGroupPermissions);
router.delete("/user/groups/:groupId/delete", UserGroupController.deleteUserGroup);

router.post("/dashboards/client/new", DashboardController.createClientDashboardNew);
router.get("/dashboards", DashboardController.getAllDashboards);
router.get("/dashboards/single/:dashboardId", DashboardController.getDashboardById);
router.put("/dashboards/:dashboardId", DashboardController.updateClientTrafficDashboard);
router.delete("/dashboards/:dashboardId", DashboardController.deleteDashboard);
router.get("/dashboards/debug", DashboardController.debugDashboardStructure);

export default router;