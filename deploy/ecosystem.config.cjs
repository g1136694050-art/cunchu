module.exports = {
  apps: [
    {
      name: 'shounawu-api',
      cwd: '/var/www/shounawu/api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
