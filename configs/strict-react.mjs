import { oneModuleRule } from '../rules/one-module.rule.mjs';

import react from './react.mjs';
import { strictRule } from './strict.mjs';

export default [...react, strictRule, oneModuleRule];
