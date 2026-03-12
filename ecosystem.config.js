// PM2 Ecosystem Config — SMSOK Clone
// Usage: pm2 start ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name: "smsok-clone",
      script: ".next/standalone/server.js",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      max_memory_restart: "512M",
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000,
      listen_timeout: 10000,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/smsok/error.log",
      out_file: "/var/log/smsok/out.log",
      merge_logs: true,
      log_type: "json",
    },
    {
      name: "smsok-workers",
      script: "workers/start.ts",
      interpreter: "bun",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
      },
      max_memory_restart: "256M",
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: "10s",
      error_file: "/var/log/smsok/workers-error.log",
      out_file: "/var/log/smsok/workers-out.log",
      merge_logs: true,
      log_type: "json",
    },
  ],
};
