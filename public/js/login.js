const form = document.getElementById("loginForm");
const errorEl = document.getElementById("error");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        errorEl.textContent = "Username and password are required";
        return;
    }

    try {
        const response = await fetch("http://localhost:8009/api/zabbix/v1/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        // Success → redirect
        window.location.href = "../html/dashboard.html";

    } catch (err) {
        errorEl.textContent = err.message;
    }
});
