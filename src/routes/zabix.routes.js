import { Router } from "express";
import HostController from "../controllers/host.controller.js";
import { zabbixSessionMiddleware } from "../../middlewares/zabbix.session.middleware.js";
import DashboardController from "../controllers/dashboard.controller.js";
import UserController from "../controllers/user.controller.js";
import AuthController from "../controllers/auth.controller.js";
import UserGroupController from "../controllers/user.groups.controller.js";

const router = Router();

router.post("/login", AuthController.login);

router.use(zabbixSessionMiddleware);

router.post("/logout", AuthController.logout);
router.get("/roles/", AuthController.getAllRoles);

router.get("/hosts", HostController.getHosts);
router.post("/hosts/create", HostController.createHost);
router.post("/host-groups", HostController.createHostGroup);
router.post("/host-groups/add-host", HostController.addHostToGroup);

router.post("/user/submit", UserController.createClientUser);
router.get("/users/", UserController.getAllUsers);
router.put("/user/modify", UserController.updateClientUser);
router.delete('/user/delete', UserController.deleteClientUser);

router.get("/users/groups", UserGroupController.userGroups);
router.get("/hosts/groups", UserGroupController.hostGroups);
router.post("/user/groups/submit", UserGroupController.createClientUserGroup);
router.put("/user/groups/permissions", UserGroupController.updateUserGroupPermissions);

router.post("/dashboards/client-traffic",DashboardController.createClientTrafficDashboard);

export default router;