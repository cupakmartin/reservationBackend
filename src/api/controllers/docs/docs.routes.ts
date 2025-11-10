import { Router } from 'express';
import swaggerUI from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = Router();

const specPath = path.join(process.cwd(), 'docs', 'openapi.yaml')
const spec = yaml.load(fs.readFileSync(specPath, 'utf8'))

router.use('/', swaggerUI.serve, swaggerUI.setup(spec, {
    explorer: true,
    customSiteTitle: "Reservation system backend"
}))

export default router