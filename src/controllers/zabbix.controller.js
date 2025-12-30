import zabbixService from "../services/zabbix.service.js";

export default class ZabbixController {

  static login = async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required"
        });
      }

      const { sessionId } = await zabbixService.login(username, password);

      // Set cookie
      res.cookie("zbx_session", sessionId, {
        httpOnly: true,        // not accessible via JS
        secure: process.env.NODE_ENV === "production", // HTTPS only in prod
        sameSite: "lax",       // safe default for same-site frontend
        maxAge: 30 * 60 * 1000 // 30 minutes
      });

      res.status(200).json({
        success: true,
        message: "Login successful"
      });

    } catch (err) {
      console.error("Zabbix login error:", err);
      next(err);
    }
  };

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

  static async getAllUsers(req, res, next) {
    try {
      const data = await zabbixService.getUsers({ authToken: req.zabbix.authToken });

      return res.status(200).json({
        success: true,
        message: "ok",
        data
      });

    }
    catch (err) {
      console.error(`Error occurred while fetching all users : ${err.message}`);
      next(err);
    }
  }

  static async getAllRoles(req, res, next) {
    try {
      const data = await zabbixService.getRoles({ authToken: req.zabbix.authToken });

      return res.status(200).json({
        success: true,
        message: "ok",
        data
      });

    }
    catch (err) {
      console.error(`Error occurred while fetching all users : ${err.message}`);
      next(err);
    }
  }

  static createClientUser = async (req, res, next) => {
    try {
      const {
        username,
        passwd,
        name,
        surname,
        roleId,
      } = req.body;

      if (!username || !passwd || !roleId) {
        return res.status(400).json({
          success: false,
          message: "username, passwd and roleId are required"
        });
      }

      const result = await zabbixService.createUser({
        username,
        password: passwd,
        name,
        surname,
        roleId,
        authToken: req.zabbix.authToken
      });

      return res.status(201).json({
        success: true,
        message: "ok",
        data: result
      });

    } catch (err) {
      next(err);
    }
  };

  static userGroups = async (req, res, next) => {
    try {
      const data = await zabbixService.getUserGroups({ authToken: req.zabbix.authToken });

      return res.status(200).json({
        success: true,
        message: "ok",
        data
      });

    } catch (error) {
      console.error(`Error fetching user groups : ${err}`)
      next(error);
    }
  }

  static hostGroups = async (req, res, next) => {
    try {
      const data = await zabbixService.getHostGroups({ authToken: req.zabbix.authToken });

      return res.status(200).json({
        success: true,
        message: "ok",
        data
      });

    } catch (error) {
      console.error(`Error fetching host groups : ${err}`)
      next(error);
    }
  }

  static createClientUserGroup = async (req, res, next) => {
    try {
      const { name, userIds, hostGroupIds } = req.body;

      if (!name || !Array.isArray(hostGroupIds)) {
        return res.status(400).json({
          success: false,
          message: "name and hostGroupIds[] are required"
        });
      }

      const result = await zabbixService.createUserGroup({
        name,
        userIds,
        hostGroupIds,
        authToken: req.zabbix.authToken
      });

      const userGroupId = result.usrgrpids[0];

      await zabbixService.setUserGroupPermissions({
        userGroupId,
        hostGroupIds,
        permission: 2, // READ ONLY
        authToken: req.zabbix.authToken
      });


      res.status(201).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.log(`Error creating client user group : ${err.message}`);
      next(err);
    }
  };

  static updateUserGroupPermissions = async (req, res, next) => {
  try {
    const { userGroupId, hostGroupIds } = req.body;

    if (!userGroupId || !Array.isArray(hostGroupIds)) {
      return res.status(400).json({
        success: false,
        message: "userGroupId and hostGroupIds[] are required"
      });
    }

    const result = await zabbixService.setUserGroupPermissions({
      userGroupId,
      hostGroupIds,
      permission: 2, 
      authToken: req.zabbix.authToken
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error("Error updating user group permissions:", err.message);
    next(err);
  }
};

}