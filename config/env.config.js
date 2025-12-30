import dotenv from "dotenv";

dotenv.config();

export const nodeEnv = process.env.NODE_ENV || "development";
export const port = process.env.PORT || 3000;
export const requestTimeout = Number(process.env.REQUEST_TIMEOUT || 5000);
export const zabbixUrl = process.env.ZABBIX_URL;