export const submitUser = async (payload, mode) => {
    const url =
        mode === "create"
            ? "/api/zabbix/v1/user/submit"
            : "/api/zabbix/v1/user/modify";

    const method = mode === "create" ? "POST" : "PUT";

    return fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
};
