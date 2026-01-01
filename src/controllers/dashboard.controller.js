import ZabbixDashboardService from "../services/zabbix.dashboard.service.js";

export default class DashboardController {

  // changes after meeting
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

  static createMultiHostDashboard = async (req, res, next) => {
    try {
      const {
        clientUserId,
        hostGroupId,
        dashboardName,
        hostsData
      } = req.body;

      if (!clientUserId || !hostGroupId || !hostsData) {
        return res.status(400).json({
          success: false,
          message: "clientUserId, hostGroupId and hostsData are required"
        });
      }

      const result = await ZabbixDashboardService.createMultiHostDashboard({
        clientUserId,
        hostGroupId,
        dashboardName,
        hostsData,
        authToken: req.zabbix.authToken
      });

      res.status(201).json(result);

    } catch (err) {
      console.error("Multi-host dashboard creation error:", err.message);
      next(err);
    }
  };

  static updateClientTrafficDashboard = async (req, res, next) => {
    try {
      const { dashboardId } = req.params;
      const { clientUserId, hostGroupId, dashboardName } = req.body;

      const result = await ZabbixDashboardService.updateClientTrafficDashboard({
        dashboardId,
        clientUserId,
        hostGroupId,
        dashboardName,
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
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
      const { clientUserId, includeWidgets } = req.query;

      const result = await ZabbixDashboardService.getAllDashboards({
        authToken: req.zabbix.authToken,
        clientUserId: clientUserId || null,
        includeWidgets: includeWidgets === 'true'
      });

      res.status(200).json({
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
      const result = await ZabbixDashboardService.getDashboardById({
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
  static deleteMultipleDashboards = async (req, res, next) => {
    try {
      const { dashboardIds } = req.body;

      if (!dashboardIds || !Array.isArray(dashboardIds)) {
        return res.status(400).json({
          success: false,
          message: "dashboardIds array is required"
        });
      }

      const result = await ZabbixDashboardService.deleteMultipleDashboards({
        dashboardIds,
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Delete multiple dashboards error:", err.message);
      next(err);
    }
  };

  static getUserDashboards = async (req, res, next) => {
    try {
      const { userId } = req.params;

      const result = await ZabbixDashboardService.getAllDashboards({
        authToken: req.zabbix.authToken,
        clientUserId: userId,
        includeWidgets: false
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Get user dashboards error:", err.message);
      next(err);
    }
  };

  // NEW METHODS FOR HOST ITEMS AND GROUPS
  static getHostItems = async (req, res, next) => {
    try {
      const { hostId } = req.params;
      const { search } = req.query;

      const result = await ZabbixDashboardService.getHostItems({
        hostId,
        search: search || null,
        authToken: req.zabbix.authToken
      });

      res.status(200).json(result);

    } catch (err) {
      console.error("Get host items error:", err.message);
      next(err);
    }
  };

  // NEW METHOD: Create Multi-Host Dashboard
  static createMultiHostDashboard = async (req, res, next) => {
    try {
      const {
        clientUserId,
        hostGroupId,
        dashboardName,
        hostsData
      } = req.body;

      if (!clientUserId || !hostGroupId || !hostsData) {
        return res.status(400).json({
          success: false,
          message: "clientUserId, hostGroupId and hostsData are required"
        });
      }

      const result = await ZabbixDashboardService.createMultiHostDashboard({
        clientUserId,
        hostGroupId,
        dashboardName,
        hostsData,
        authToken: req.zabbix.authToken
      });

      res.status(201).json(result);

    } catch (err) {
      console.error("Multi-host dashboard creation error:", err.message);
      next(err);
    }
  };


  // NEW METHOD: Get Dashboard for Edit
  static getDashboardForEdit = async (req, res, next) => {
    try {
      const { dashboardId } = req.params;

      const result = await ZabbixDashboardService.getDashboardById({
        dashboardId,
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error("Get dashboard for edit error:", err.message);
      next(err);
    }
  };

  // NEW METHOD: Update Dashboard with Items (for edit)
  static updateDashboardWithItems = async (req, res, next) => {
    try {
      const { dashboardId } = req.params;
      const {
        clientUserId,
        hostGroupId,
        dashboardName,
        hostsData // Format: { "hostId1": ["itemId1", "itemId2"], "hostId2": ["itemId3"] }
      } = req.body;

      if (!dashboardId || !dashboardName) {
        return res.status(400).json({
          success: false,
          message: "dashboardId and dashboardName are required"
        });
      }

      // Check if we have hostsData for multi-host update
      if (hostsData && typeof hostsData === 'object') {
        // Multi-host update
        const result = await ZabbixDashboardService.updateMultiHostDashboard({
          dashboardId,
          clientUserId,
          hostGroupId,
          dashboardName,
          hostsData,
          authToken: req.zabbix.authToken
        });

        res.status(200).json(result);
      } else {
        // Single host update (for backward compatibility)
        const result = await ZabbixDashboardService.updateClientTrafficDashboard({
          dashboardId,
          clientUserId,
          hostGroupId,
          dashboardName,
          authToken: req.zabbix.authToken
        });

        res.status(200).json(result);
      }

    } catch (err) {
      console.error("Update dashboard with items error:", err.message);
      next(err);
    }
  };

  static getHostsByGroupId = async (req, res, next) => {
    try {
      const { groupId } = req.params;

      const result = await ZabbixDashboardService.getHostsByGroupId({
        groupId,
        authToken: req.zabbix.authToken
      });

      res.status(200).json(result);

    } catch (err) {
      console.error("Get hosts by group error:", err.message);
      next(err);
    }
  };


  static getHostGroups = async (req, res, next) => {
    try {
      const result = await ZabbixDashboardService.getHostGroups({
        authToken: req.zabbix.authToken
      });

      res.status(200).json(result);

    } catch (err) {
      console.error("Get host groups error:", err.message);
      next(err);
    }
  };

  static getUsers = async (req, res, next) => {
    try {
      const result = await ZabbixDashboardService.getUsers({
        authToken: req.zabbix.authToken
      });

      res.status(200).json(result);

    } catch (err) {
      console.error("Get users error:", err.message);
      next(err);
    }
  };
}