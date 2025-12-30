import { Router } from "express";
import ZabbixController from "../controllers/zabbix.controller.js";
import { zabbixSessionMiddleware } from "../../middlewares/zabbix.session.middleware.js";
import ZabbixDashboardController from "../controllers/zabbix.dashboard.controller.js";

const router = Router();

router.post("/login", ZabbixController.login);

router.use(zabbixSessionMiddleware);

router.get("/hosts", ZabbixController.getHosts);
router.post("/hosts/create", ZabbixController.createHost);
router.post("/host-groups", ZabbixController.createHostGroup);
router.post("/host-groups/add-host", ZabbixController.addHostToGroup);

router.get("/users/", ZabbixController.getAllUsers);
router.get("/roles/", ZabbixController.getAllRoles);
router.post("/user/submit", ZabbixController.createClientUser);

router.get("/users/groups", ZabbixController.userGroups);
router.get("/hosts/groups", ZabbixController.hostGroups);
router.post("/user/groups/submit", ZabbixController.createClientUserGroup);
router.put("/user/groups/permissions", ZabbixController.updateUserGroupPermissions);

router.post("/dashboards/client-traffic",ZabbixDashboardController.createClientTrafficDashboard);

export default router;