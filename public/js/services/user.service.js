const API_BASE = "http://localhost:8009/api/zabbix/v1";

export const submitUser = async (payload, mode) => {
    const url = mode === "create"
        ? `${API_BASE}/user/submit`
        : `${API_BASE}/user/modify`;

    const method = mode === "create" ? "POST" : "PUT";

    return fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
};

export const deleteUser = (userid) => {
    return fetch(`${API_BASE}/user/delete`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userid }) // important fix
    });
};
