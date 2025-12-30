import zabbixService from "../services/zabbix.service.js";

export default class HostController {

  static getHosts = async (req, res, next) => {
    try {
      const result = await zabbixService.rpcCall({
        method: "host.get",
        params: {
          output: ["hostid", "name"],
          monitored_hosts: true
        },
        authToken: req.zabbix.authToken
      });

      res.status(200).json({
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

      const result = await zabbixService.createHostGroup({
        name,
        authToken: req.zabbix.authToken
      });

      res.status(201).json({
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

      const result = await zabbixService.addHostToGroup({
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

      const result = await zabbixService.createHost({
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

}