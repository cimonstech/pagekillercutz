module.exports = {
  apps: [
    {
      name: "killercutz",
      script: "server.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "./logs/app.out.log",
      error_file: "./logs/app.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
