import axios from "axios";
import { zabbixUrl } from "../../config/env.config.js";

export default class ZabbixService {

  static requestId = 1;

  static async rpcCall({
    method,
    params = {},
    authToken = null,
    timeout = 10000,
    maxRetries = 2
  }) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const payload = {
          jsonrpc: "2.0",
          method,
          params,
          id: this.requestId++
        };

        const headers = {
          "Content-Type": "application/json"
        };

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await axios.post(zabbixUrl, payload, {
          headers,
          timeout
        });

        if (response.data.error) {
          throw new Error(response.data.error.data);
        }

        return response.data.result;

      } catch (error) {
        lastError = error;

        // Don't retry on timeout in last attempt
        if (attempt === maxRetries) break;

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        break;
      }
    }

    if (lastError.code === 'ECONNABORTED' || lastError.message.includes('timeout')) {
      throw {
        statusCode: 504,
        message: `Request timeout after ${maxRetries + 1} attempts. Zabbix server is taking too long to respond.`
      };
    }

    throw {
      statusCode: 500,
      message: lastError.message || "Zabbix API error"
    };
  }

  static async getUsersWithGroups({ authToken }) {
    if (!authToken) {
      throw new Error("No authToken provided");
    }

    return await this.rpcCall({
      method: "user.get",
      params: {
        output: ["userid", "username", "name", "surname"],
        selectUsrgrps: ["usrgrpid", "name"]
      },
      authToken
    });
  }

  static async getHostGroups({ authToken }) {
    return await this.rpcCall({
      method: "hostgroup.get",
      params: {
        output: ["groupid", "name"]
      },
      authToken
    });
  }

  static async createUserGroup({
    name,
    userIds = [],
    authToken
  }) {
    if (!name) {
      throw new Error("Group name is required");
    }

    return await this.rpcCall({
      method: "usergroup.create",
      params: {
        name,
        users: userIds.map(id => ({ userid: id }))
      },
      authToken
    });
  }

  static async setUserGroupPermissions({
    userGroupId,
    hostGroupIds,
    permission = 2, // 2 = READ, 3 = WRITE
    authToken
  }) {
    if (!userGroupId || !Array.isArray(hostGroupIds) || !hostGroupIds.length) {
      throw new Error("userGroupId and hostGroupIds are required");
    }

    // 1️⃣ ENABLE GUI ACCESS (CRITICAL)
    await this.rpcCall({
      method: "usergroup.update",
      params: {
        usrgrpid: userGroupId,
        gui_access: 1
      },
      authToken
    });

    // 2️⃣ SET HOST GROUP PERMISSIONS
    const updateResult = await this.rpcCall({
      method: "usergroup.update",
      params: {
        usrgrpid: userGroupId,
        hostgroup_rights: hostGroupIds.map(id => ({
          id,          // <-- REQUIRED for your Zabbix version
          permission   // 2 = READ, 3 = WRITE
        }))
      },
      authToken
    });

    // 3️⃣ OPTIONAL VERIFICATION (safe to keep during dev)
    const verifyResult = await this.rpcCall({
      method: "usergroup.get",
      params: {
        usrgrpids: userGroupId,
        selectHostGroupRights: "extend",
        output: ["gui_access"]
      },
      authToken
    });

    return {
      updateResult,
      verifyResult
    };
  }

}