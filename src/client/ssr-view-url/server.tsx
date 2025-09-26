import * as cookie from 'cookie';
import { FastifyRequest } from 'fastify';

import { config as zConfig } from '@/lib/config';
import { Config } from '@/lib/config/validate';
import { verifyPassword } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { renderHtml } from '@/lib/ssr/renderHtml';
import { NodeCastTheme } from '@/lib/theme';
import { createRoutes } from './routes'; // This should include the `/url/:id` route

export async function render(
  {
    themes,
    defaultTheme,
    req,
  }: {
    themes: NodeCastTheme[];
    defaultTheme: Config['website']['theme'];
    req: FastifyRequest;
  },
  url: string,
) {
  const routes = createRoutes(themes, defaultTheme);

  const id = url.split('/').pop();
  if (!id) return { html: 'Not Found', meta: '', status: 404 };

  const { config: libConfig, reloadSettings } = await import('@/lib/config');
  if (!libConfig) await reloadSettings();

  const urlEntry = await prisma.url.findFirst({
    where: {
      OR: [{ vanity: id }, { code: id }, { id }],
    },
    select: {
      id: true,
      password: true,
      destination: true,
      maxViews: true,
      views: true,
      enabled: true,
    },
  });

  if (!urlEntry || !urlEntry.enabled) return { html: 'Not Found', meta: '', status: 404 };

  if (urlEntry.maxViews && urlEntry.views >= urlEntry.maxViews) {
    if (zConfig.features.deleteOnMaxViews) {
      await prisma.url.delete({ where: { id: urlEntry.id } });
    }
    return { html: 'Gone', meta: '', status: 410 };
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const pw = cookies[`url_pw_${urlEntry.id}`];
  const hasPassword = !!urlEntry.password;

  const data = {
    url: { ...urlEntry },
    password: hasPassword,
  };

  if (hasPassword) {
    delete (data.url as any).password;
    if (pw) {
      const verified = await verifyPassword(pw, urlEntry.password!);
      if (!verified) {
        delete (data.url as any).destination;
        return renderHtml(routes, { url, data, status: 403 });
      }
    } else {
      delete (data.url as any).destination;
      return renderHtml(routes, { url, data, status: 403 });
    }
  }

  delete (data.url as any).password;

  await prisma.url.update({
    where: { id: urlEntry.id },
    data: { views: { increment: 1 } },
  });

  if (data.url.destination) {
    return {
      html: '',
      meta: '',
      redirect: data.url.destination,
      status: 301,
    };
  }

  return renderHtml(routes, { url, data, status: 200 });
}
