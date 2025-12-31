import axios from "axios";
import { zabbixUrl } from "../../config/env.config.js";
import crypto from "crypto";
import { redis } from "../../config/redis.js";

export default class ZabbixService {

  static requestId = 1;

  static async rpcCall({ method, params = {}, authToken = null }) {
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

      const response = await axios.post(zabbixUrl, payload, { headers });

      if (response.data.error) {
        throw new Error(response.data.error.data);
      }

      return response.data.result;

    } catch (error) {
      throw {
        statusCode: 500,
        message: error.message || "Zabbix API error"
      };
    }
  }

  static async login(username, password) {
    const authToken = await this.rpcCall({
      method: "user.login",
      params: { username, password }
    });

    const sessionId = crypto.randomUUID();

    await redis.set(
      `zabbix:session:${sessionId}`,
      JSON.stringify({ authToken, username }),
      "EX",
      1800
    );

    return { sessionId };
  }

  static async createHostGroup({ name, authToken }) {
    return await this.rpcCall({
      method: "hostgroup.create",
      params: { name },
      authToken
    });
  }

  static async addHostToGroup({ hostId, groupId, authToken }) {
    return await this.rpcCall({
      method: "host.update",
      params: {
        hostid: hostId,
        groups: [{ groupid: groupId }]
      },
      authToken
    });
  }

  static async createHost({
    host,
    name,
    ip,
    groupIds = [],
    templateIds = [],
    authToken
  }) {
    if (!groupIds.length) {
      throw new Error("At least one host group is required");
    }

    const params = {
      host,           // technical name (unique)
      name,           // display name
      interfaces: [
        {
          type: 1,    // 1 = Agent
          main: 1,
          useip: 1,
          ip,
          dns: "",
          port: "10050"
        }
      ],
      groups: groupIds.map(id => ({ groupid: id }))
    };

    // Attach templates if provided
    if (templateIds.length) {
      params.templates = templateIds.map(id => ({ templateid: id }));
    }

    return await this.rpcCall({
      method: "host.create",
      params,
      authToken
    });
  }

  static async getUsers({ authToken }) {
    return await this.rpcCall({
      method: "user.get",
      params: {
        output: ["userid", "username", "name", "surname", "roleid"],
        selectRole: ["roleid", "name"]
      },
      authToken
    });
  }

  static async getRoles({ authToken }) {
    return await this.rpcCall({
      method: "role.get",
      params: {
        output: ["roleid", "name", "type"]
      },
      authToken
    });
  }

 // ✅ ALWAYS WORKING METHOD
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


  static async createUser({
    username,
    password,
    name,
    surname,
    roleId,
    authToken
  }) {
    return await this.rpcCall({
      method: "user.create",
      params: {
        username,
        passwd: password,
        name,
        surname,
        roleid: roleId,
      },
      authToken
    });
  }

  static async getUserGroups({ authToken }) {
    return await this.rpcCall({
      method: "usergroup.get",
      params: {
        output: ["usrgrpid", "name"]
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

  static async updateUser({ authToken, payload }) {
    return await this.rpcCall({
      method: "user.update",
      params: payload,
      authToken
    });
  }

  // async deleteUser({ authToken, userid }) {
  //   try {
  //     const response = await this.makeRequest('user.delete', authToken, [userid]);

  //     if (response.error) {
  //       throw new Error(response.error.data || 'Failed to delete user');
  //     }

  //     return response.result;
  //   } catch (err) {
  //     console.error(`Zabbix API deleteUser error: ${err.message}`);
  //     throw err;
  //   }
  // }

  static async deleteUser({ authToken, userid }) {
    try {
      const response = await this.rpcCall({
        method: "user.delete",
        params: [userid], // Zabbix API expects an array of IDs
        authToken
      });

      return response;
    } catch (err) {
      console.error(`Zabbix API deleteUser error: ${err.message}`);
      throw err;
    }
  }

}