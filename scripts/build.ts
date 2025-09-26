import { run, step } from '.';
import { lintStep } from './lint';

// Check for skip-lint flag before running steps
const skipLint = process.argv.includes('--skip-lint');
const isDockerBuild = !!process.env.NODECAST_BUILD;

run(
  'build',

  // Conditionally include linting step
  ...(skipLint ? [] : [lintStep]),
  step('prisma', 'prisma generate'),
  step('typecheck', 'tsc', () => !process.argv.includes('--skip') && !isDockerBuild),

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
