import { sonarRules } from '../rules/sonar.generated.mjs';

import base from './base.mjs';

export default [...base, ...sonarRules];
