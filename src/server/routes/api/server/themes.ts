import { config } from '@/lib/config';
import { Config } from '@/lib/config/validate';
import { NodeCastTheme } from '@/lib/theme';
import { readThemes } from '@/lib/theme/file';
import fastifyPlugin from 'fastify-plugin';

export type ApiServerThemesResponse = {
  themes: NodeCastTheme[];
  defaultTheme: Config['website']['theme'];
};

export const PATH = '/api/server/themes';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, async (req, res) => {
      const themes = await readThemes();

      return res.send({ themes, defaultTheme: config.website.theme });
    });

    done();
  },
  { name: PATH },
);
