import { sonarRules } from '../rules/sonar.generated.mjs';

import react from './react.mjs';

export default [...react, ...sonarRules];
