import { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { createServer } from 'vite';
import { reservedRoutes } from '../routes/api/server/settings';
import { config } from '@/lib/config';
import fastifyStatic from '@fastify/static';
import { renderHtml } from '@/lib/ssr/renderHtml';
import { readThemes } from '@/lib/theme/file';
import { NODECAST_SSR_INSERT, NODECAST_SSR_META } from '@/lib/ssr/constants';

export const ALL_METHODS: HTTPMethods[] = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'];

const MODE = process.env.NODE_ENV || 'development';

async function vitePlugin(fastify: FastifyInstance) {
  fastify.decorateReply('ssr', ssrRoute);

  if (MODE === 'production') {
    fastify.decorate('serveIndex', route);
    fastify.decorateReply('serveIndex', serveIndex);

    await fastify.register(fastifyStatic, {
      root: resolve('./build/client'),
      prefix: '/',
      decorateReply: false,
    });
  } else {
    const vite = await createServer();

    console.log('Vite server created in development mode');

    fastify.decorate('vite', vite);
    fastify.addHook('onRequest', async (req, reply) => {
      const url = req.raw.url || '';

      const reserved = [
        ...reservedRoutes.filter((x) => x !== '/dashboard' && x !== '/auth'),
        config.files.route,
        config.urls.route,
      ].some((route) => url.startsWith(route));

      if (reserved) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        vite!.middlewares(req.raw, reply.raw, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async function ssrRoute(this: FastifyReply, type: 'view-url' | 'view') {
    const url = this.request.raw.url || '/';

    try {
      let template: string;
      let render: (response: any, url: string) => Promise<ReturnType<typeof renderHtml>>;

      if (MODE === 'development' && fastify.vite) {
        template = await readFile(resolve(`./src/client/ssr-${type}/`, 'index.html'), 'utf-8');
        template = await fastify.vite.transformIndexHtml(url, template);

        // expose __dirname since dev modules are loaded in esm
        global.__dirname = __dirname;
        render = (await fastify.vite.ssrLoadModule(`/ssr-${type}/server.tsx`)).render;
      } else {
        template = await readFile(resolve('./build', `client/ssr-${type}/index.html`), 'utf-8');
        render = (await import(`../../ssr/ssr-${type}.js`)).render;
      }

      const { html, meta, status, redirect } = await render(
        {
          themes: await readThemes(),
          defaultTheme: config.website.theme,
          req: this.request,
        },
        url,
      );

      if (redirect) {
        return this.redirect(redirect, status);
      }

      if (status && [404, 410].includes(status)) return this.callNotFound();

      const finalHtml = template.replace(NODECAST_SSR_META, meta!).replace(NODECAST_SSR_INSERT, html);

      return this.type('text/html').send(finalHtml);
    } catch (err) {
      if (MODE === 'development' && fastify.vite) fastify.vite.ssrFixStacktrace(err as Error);
      console.error(err);
      return this.internalServerError();
    }
  }

  function route(this: FastifyInstance, path: string, method: HTTPMethods | HTTPMethods[] = 'GET') {
    this.route({
      method,
      url: path,
      handler,
    });

    async function handler(_: FastifyRequest, reply: FastifyReply) {
      return reply.serveIndex();
    }
  }

  async function serveIndex(this: FastifyReply) {
    return this.sendFile('index.html', resolve('./build/client'));
  }
}

export default fastifyPlugin(vitePlugin, {
  name: 'vite',
  fastify: '5.x',
});

declare module 'fastify' {
  interface FastifyInstance {
    vite?: Awaited<ReturnType<typeof createServer>>;
    serveIndex: (path: string, method?: HTTPMethods | HTTPMethods[]) => void;
  }

  interface FastifyReply {
    ssr: (type: 'view-url' | 'view') => Promise<void>;
    serveIndex: () => Promise<void>;
  }
}
