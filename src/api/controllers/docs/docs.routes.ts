import { Router, static as expressStatic } from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = Router();

// Load OpenAPI spec
const specPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
const specContent = fs.readFileSync(specPath, 'utf8');
const spec = yaml.load(specContent) as Record<string, any>;

// Serve OpenAPI spec as JSON
router.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(spec);
});

// Serve static Swagger UI files from node_modules
const swaggerUiPath = path.join(process.cwd(), 'node_modules', 'swagger-ui-dist');
router.use('/static', expressStatic(swaggerUiPath));

// Serve custom index page that loads Swagger UI
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Cosmetic Salon</title>
  <link rel="stylesheet" href="/docs/static/swagger-ui.css" />
  <link rel="icon" type="image/png" href="/docs/static/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="/docs/static/favicon-16x16.png" sizes="16x16" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs/static/swagger-ui-bundle.js"></script>
  <script src="/docs/static/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
  `);
});

export default router;