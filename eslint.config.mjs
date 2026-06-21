import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // eslint-config-next 16 promotes these React-Compiler-era rules to errors.
    // They fire on legitimate pre-existing patterns (DOM-measurement effects,
    // local builder mutation), so keep them visible as warnings rather than
    // blocking. Revisit during the dead-code / refactor cleanup.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**'],
  },
];

export default eslintConfig;
