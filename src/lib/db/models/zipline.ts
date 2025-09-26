import { prisma } from '..';

export async function getNodeCast() {
  const nodecast = await prisma.nodeCast.findFirst();
  if (!nodecast) {
    return prisma.nodeCast.create({
      data: {
        coreTempDirectory: '/tmp/nodecast',
      },
    });
  }

  return nodecast;
}
