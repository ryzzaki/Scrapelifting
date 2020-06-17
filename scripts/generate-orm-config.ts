import * as fs from 'fs';
import { getTypeOrmConfig } from '../src/config/app.config';

fs.writeFileSync('ormconfig.json', JSON.stringify(getTypeOrmConfig(), null, 1));
