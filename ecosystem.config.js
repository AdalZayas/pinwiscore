module.exports = {
  apps: [
    {
      name: "pinwiscore",
      script: ".next/standalone/server.js",
      cwd: "/home/aszyh/dev/pinwiscore",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 7777,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
