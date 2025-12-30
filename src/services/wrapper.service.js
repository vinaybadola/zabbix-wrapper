import axios from "axios";
import { internalServiceUrl, requestTimeout } from "../../config/env.config.js";

export const processRequest = async (payload, headers) => {
    const response = await axios.post(
        internalServiceUrl,
        payload,
        { timeout: requestTimeout }
    );

    return {
        success: true,
        data: response.data,
    };
};
