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

// GROUP DELETE ROUTE - ADD THIS LINE
router.delete("/user/groups/:groupId/delete", UserGroupController.deleteUserGroup);

// Dashboard routes
router.post("/dashboards/client-traffic", DashboardController.createClientTrafficDashboard);

// Add these routes after your existing dashboard routes
// router.get("/dashboards", DashboardController.getAllDashboards);
// router.get("/dashboards/:dashboardId", DashboardController.getDashboardById);
// router.delete("/dashboards/:dashboardId", DashboardController.deleteDashboard);


export default router;