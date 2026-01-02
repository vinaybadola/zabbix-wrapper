import HostService from "../services/host.service.js";

export default class HostController {

  static getHosts = async (req, res, next) => {
    try {
      const result = await HostService.getAllHosts({
        authToken: req.zabbix.authToken
      });

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error(`Error fetchign get hosts : ${err.message}`);
      next(err);
    }
  };

  static createHostGroup = async (req, res, next) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Group name is required"
        });
      }

      const result = await HostService.createHostGroup({
        name,
        authToken: req.zabbix.authToken
      });

      return res.status(201).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error(`Error ocurred while createHostGroup : ${err}`);
      next(err);
    }
  };

  static addHostToGroup = async (req, res, next) => {
    try {
      const { hostId, groupId } = req.body;

      if (!hostId || !groupId) {
        return res.status(400).json({
          success: false,
          message: "hostId and groupId are required"
        });
      }

      const result = await HostService.addHostToGroup({
        hostId,
        groupId,
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error(`Error ocurred while adding host to group : ${err}`);
      next(err);
    }
  };

  static createHost = async (req, res, next) => {
    try {
      const { host, name, ip, groupIds, templateIds = [] } = req.body;

      if (!host || !name || !ip || !Array.isArray(groupIds)) {
        return res.status(400).json({
          success: false,
          message: "host, name, ip and groupIds[] are required"
        });
      }

      const result = await HostService.createHost({
        host,
        name,
        ip,
        groupIds,
        templateIds,
        authToken: req.zabbix.authToken
      });

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (err) {
      next(err);
    }
  };

  static fetchHostFromHostGroups = async (req, res, next) => {
    try {
      const { hostGroupIds } = req.body;

      const data = await HostService.fetchHostsFromHostGroup({
        hostGroupIds,
        authToken: req.zabbix.authToken
      })

      return res.status(200).json({ success: true, message: "ok", data });

    } catch (error) {
      console.error(`Error fetching hosts from host group Ids : ${error.message}`);
      next(error)
    }
  }

  static fetchHostItems = async (req, res, next) => {
    try {
      const { hostIds } = req.body;

      const data = await HostService.fetchHostItems({
        hostIds,
        authToken: req.zabbix.authToken
      })

      return res.status(200).json({ success: true, message: "ok", data });

    } catch (error) {
      console.error(`Error fetching hosts items from host Ids : ${error.message}`);
      next(error)
    }
  }

  static fetchHostGroups = async (req, res, next) => {
    try {
      const data = await HostService.getHostGroups({
        authToken: req.zabbix.authToken
      });

      return res.status(200).json({ success: data.success, message: "ok", data: data.data });
    } catch (err) {
      console.error(`Error fetching host groups : ${err.message}`);
      next(err);
    }
  };

}