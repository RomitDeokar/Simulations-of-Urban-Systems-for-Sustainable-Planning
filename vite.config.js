import { defineConfig } from 'vite';

const allowedHosts = [
  '3000-iedrl40j6u6iey4qp7q9h-3c7ff1b5.sandbox.novita.ai',
  '3000-i495cz7171j8vtjo0os2u-02b9cc79.sandbox.novita.ai',
];

export default defineConfig({
  server: {
    allowedHosts,
  },
  preview: {
    allowedHosts,
  },
});
