module.exports = {
    apps: [
        {
            name: "zabbix-backend",
            script: "server.js",

            // Environment
            env: {
                NODE_ENV: "production",
                PORT: 8007
            },

            env_production: {
                NODE_ENV: "production",
                PORT: 8007
            },

            // Logs
            error_file: "/var/log/zabbix/error.log",
            out_file: "/var/log/zabbix/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss",

            // Stability
            autorestart: true,
            watch: false,
            max_memory_restart: "600M",

            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 5000,

            // Performance
            node_args: "--enable-source-maps"
        }
    ]
};
