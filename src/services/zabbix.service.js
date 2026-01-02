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

}