import { NODECAST_SSR_PROP } from './constants';

export function createNodeCastSsr(data: any) {
  return `<script>window.${NODECAST_SSR_PROP} = ${JSON.stringify(data).replace(/</g, '\u003c')};</script>`;
}
