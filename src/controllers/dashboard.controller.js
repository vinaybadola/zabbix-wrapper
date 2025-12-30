import ZabbixDashboardService from "../services/zabbix.dashboard.service.js";

export default class DashboardController {

  static createClientTrafficDashboard = async (req, res, next) => {
    try {
      const { clientUserId, hostGroupId, dashboardName } = req.body;

      if (!clientUserId || !hostGroupId) {
        return res.status(400).json({
          success: false,
          message: "clientUserId and hostGroupId are required"
        });
      }

      const result = await ZabbixDashboardService.createClientTrafficDashboard({
          clientUserId,
          hostGroupId,
          dashboardName,
          authToken: req.zabbix.authToken
        });

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Dashboard creation error:", err.message);
      next(err);
    }
  };
}
