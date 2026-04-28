export const defaultFiles = {
  'index.js': {
    file: {
      contents: `
import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
  res.send(\`
    <html>
      <head>
        <title>WebContainer App</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          .env-var { color: #f43f5e; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Hello from WebContainer!</h1>
        <p>This is a live Node.js server running in your browser.</p>
        <p>Custom Variable: <span class="env-var">\${process.env.MY_CUSTOM_VAR || 'Not Set'}</span></p>
      </body>
    </html>
  \`);
});

app.listen(port, () => {
  console.log(\`App is live at http://localhost:\${port}\`);
});
      `,
    },
  },
  'package.json': {
    file: {
      contents: `
{
  "name": "example-app",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "nodemon": "latest"
  },
  "scripts": {
    "start": "nodemon index.js"
  }
}
      `,
    },
  },
};
