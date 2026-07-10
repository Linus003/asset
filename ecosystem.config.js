module.exports = {
  apps: [
    {
      name: "asset",
      script: "pnpm",
      args: "run start",
      cwd: "/var/www/html/asset",
      env: {
        PORT: 8085
      }
    }
  ]
};
