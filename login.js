import axios from "axios";

const ZABBIX_URL = "http://10.253.68.52/zabbix/api_jsonrpc.php";

async function zabbixLogin() {
    const payload = {
        jsonrpc: "2.0",
        method: "user.login",
        params: {
            username: "Admin",
            password: "zabbix"
        },
        id: 1
    };

    const response = await axios.post(ZABBIX_URL, payload, {
        headers: {
            "Content-Type": "application/json"
        }
    });

    console.log("Auth token:", response.data.result);
}

zabbixLogin().catch(console.error);
