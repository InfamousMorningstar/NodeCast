import { NodeCastTheme } from '@/lib/theme';
import Root from '../Root';
import { Config } from '@/lib/config/validate';
import ViewUrlId from '../pages/view/url/[id]';

export const createRoutes = (themes?: NodeCastTheme[], defaultTheme?: Config['website']['theme']) => [
  {
    path: '/view/url',
    Component:
      typeof window === 'undefined' ? undefined : () => <Root themes={themes} defaultTheme={defaultTheme} />,
    children: [
      {
        path: ':id',
        Component: () => <ViewUrlId />,
      },
    ],
  },
];
