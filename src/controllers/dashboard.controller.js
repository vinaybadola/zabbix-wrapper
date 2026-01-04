import DashboardService from "../services/dashboard.service.js";
import ZabbixDashboardService from "../services/zabbix.dashboard.service.js";

export default class DashboardController {

  static createClientDashboardNew = async (req, res, next) => {
    try {
      const { dashboardName, userId, hostGroupIds, hostIds, itemIds } = req.body;

      const data = await DashboardService.createClientDashboard({
        dashboardName,
        userId,
        hostGroupIds,
        hostIds,
        itemIds,
        authToken: req.zabbix.authToken
      })

      return res.status(201).json({ success: data.success, message: data.message, data });

    } catch (error) {
      console.error(`Error creating client dashboard : ${error.message}`);
      next(error)

    }
  }

  static updateClientTrafficDashboard = async (req, res, next) => {
    try {
      const { dashboardId } = req.params;
      const { itemIds, dashboardName, hostIds } = req.body;

      const result = await DashboardService.updateClientDashboard({
        dashboardId,
        dashboardName,
        hostIds,
        itemIds,
        authToken: req.zabbix.authToken
      });

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Dashboard update error:", err.message);
      next(err);
    }
  };

  static debugDashboardStructure = async (req, res, next) => {
    try {
      const result = await ZabbixDashboardService.debugDashboardStructure({
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Debug dashboard error:", err.message);
      next(err);
    }
  };

  static getAllDashboards = async (req, res, next) => {
    try {
      const { clientUserId, includeWidgets, search } = req.query;

      const result = await ZabbixDashboardService.getAllDashboards({
        authToken: req.zabbix.authToken,
        clientUserId: clientUserId || null,
        includeWidgets: includeWidgets === 'true',
        search: search || null
      });

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Get all dashboards error:", err.message);
      next(err);
    }
  };

  static getDashboardById = async (req, res, next) => {
    try {
      const { dashboardId } = req.params;

      // Simple call without complex parameters
      const result = await ZabbixDashboardService.getDashboardInfraData({
        dashboardId,
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Get dashboard by ID error:", err.message);
      next(err);
    }
  };

  static deleteDashboard = async (req, res, next) => {
    try {
      const { dashboardId } = req.params;

      const result = await ZabbixDashboardService.deleteDashboard({
        dashboardId,
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Delete dashboard error:", err.message);
      next(err);
    }
  };

}