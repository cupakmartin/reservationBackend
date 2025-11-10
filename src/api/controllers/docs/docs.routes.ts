import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = Router();

// Load the OpenAPI spec
const specPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec));

export default router;