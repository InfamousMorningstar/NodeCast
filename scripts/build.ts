import { run, step } from '.';
import { lintStep } from './lint';

const skipLint = process.argv.includes('--skip-lint');

run(
  'build',

  // Skip linting if --skip-lint flag is present
  skipLint ? 
    step('lint', 'echo "Skipping lint step"') : 
    lintStep,
  step('prisma', 'prisma generate'),
  step('typecheck', 'tsc', () => !process.argv.includes('--skip')),

  // builds
  step('server', 'tsup'),

  // client stuff
  step('client', 'vite build'),
  step(
    'client/ssr/view',
    'vite build --ssr ssr-view/server.tsx -m ssr-view --outDir ../../build/ssr --emptyOutDir=false',
  ),
  step(
    'client/ssr/view-url',
    'vite build --ssr ssr-view-url/server.tsx -m ssr-view-url --outDir ../../build/ssr --emptyOutDir=false',
  ),
);
