import Stat from '@/components/Stat';
import type { Response } from '@/lib/api/response';
import { bytes } from '@/lib/bytes';
import useLogin from '@/lib/hooks/useLogin';
import {
  Paper,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Text,
  Title,
  Stack,
  Group,
  Badge,
  Avatar,
  Box,
} from '@mantine/core';
import {
  IconDeviceSdCard,
  IconEyeFilled,
  IconFiles,
  IconLink,
  IconStarFilled,
  IconClock,
} from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import useSWR from 'swr';

const DashboardFile = lazy(() => import('@/components/file/DashboardFile'));

export default function DashboardHome() {
  const { user } = useLogin();
  const { data: recent, isLoading: recentLoading } = useSWR<Response['/api/user/recent']>('/api/user/recent');
  const { data: stats, isLoading: statsLoading } = useSWR<Response['/api/user/stats']>('/api/user/stats');

  return (
    <Stack gap='xl' p='md'>
      {/* Welcome Section */}
      <Box
        className='glass-card'
        style={{
          background: 'var(--hero-gradient)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-xl)',
        }}
      >
        <Group gap='lg' align='center'>
          <Avatar
            size={64}
            radius='lg'
            src={user?.avatar}
            style={{
              border: '2px solid var(--accent-color)',
              boxShadow: '0 8px 32px rgba(var(--accent-rgb), 0.3)',
            }}
          >
            {user?.username?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Stack gap='xs'>
            <Title
              order={1}
              style={{
                background: 'var(--text-gradient)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              Welcome back, {user?.username}
            </Title>

            <Group gap='md'>
              <Badge variant='light' size='lg' leftSection={<IconFiles size={14} />}>
                {statsLoading ? '...' : stats?.filesUploaded} files
              </Badge>

              {user?.quota && (user.quota.maxBytes || user.quota.maxFiles) && (
                <Badge variant='light' size='lg' color='orange' leftSection={<IconDeviceSdCard size={14} />}>
                  {user.quota.filesQuota === 'BY_BYTES'
                    ? `${statsLoading ? '...' : bytes(stats!.storageUsed)} used`
                    : `${statsLoading ? '...' : stats?.filesUploaded}/${user.quota.maxFiles} files`}
                </Badge>
              )}

              {user?.quota && user.quota.maxUrls && (
                <Badge variant='light' size='lg' color='blue' leftSection={<IconLink size={14} />}>
                  {statsLoading ? '...' : stats?.urlsCreated}/{user.quota.maxUrls} links
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>
      </Box>

      {/* Stats Grid */}
      <Stack gap='md'>
        <Group justify='space-between' align='center'>
          <Title order={2}>Analytics Overview</Title>
          <Badge variant='light' color='gray' size='sm'>
            Real-time
          </Badge>
        </Group>

        {statsLoading ? (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing='lg'>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} height={120} radius='lg' />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing='lg'>
            <Stat Icon={IconFiles} title='Files uploaded' value={stats!.filesUploaded} />
            <Stat Icon={IconStarFilled} title='Favorite files' value={stats!.favoriteFiles} />
            <Stat Icon={IconDeviceSdCard} title='Storage used' value={bytes(stats!.storageUsed)} />
            <Stat Icon={IconDeviceSdCard} title='Average size' value={bytes(stats!.avgStorageUsed)} />
            <Stat Icon={IconEyeFilled} title='Total views' value={stats!.views} />
            <Stat Icon={IconEyeFilled} title='Average views' value={Math.round(stats!.avgViews)} />
            <Stat Icon={IconLink} title='Links created' value={stats!.urlsCreated} />
            <Stat Icon={IconLink} title='Link views' value={Math.round(stats!.urlViews)} />
          </SimpleGrid>
        )}
      </Stack>

      {/* Content Grid */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing='xl'>
        {/* Recent Files */}
        <Stack gap='md'>
          <Group justify='space-between' align='center'>
            <Title order={2}>Recent Files</Title>
            <Group gap='xs'>
              <IconClock size={16} style={{ opacity: 0.6 }} />
              <Text size='sm' c='dimmed'>
                Last 3 uploads
              </Text>
            </Group>
          </Group>

          <Paper
            className='glass-card'
            p='lg'
            radius='lg'
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              minHeight: 400,
            }}
          >
            {recentLoading ? (
              <Stack gap='md'>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={100} radius='md' />
                ))}
              </Stack>
            ) : recent?.length !== 0 ? (
              <Stack gap='md'>
                {recent!.map((file, i) => (
                  <Suspense fallback={<Skeleton height={100} radius='md' />} key={i}>
                    <Box style={{ transform: 'scale(1)', transition: 'transform 0.2s ease' }}>
                      <DashboardFile file={file} />
                    </Box>
                  </Suspense>
                ))}
              </Stack>
            ) : (
              <Stack align='center' justify='center' h={300} gap='md'>
                <IconFiles size={48} style={{ opacity: 0.3 }} />
                <Stack gap='xs' align='center'>
                  <Text size='lg' fw={500} c='dimmed'>
                    No recent files
                  </Text>
                  <Text size='sm' c='dimmed' ta='center'>
                    Your last three uploads will appear here
                  </Text>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Stack>

        {/* File Types */}
        <Stack gap='md'>
          <Title order={2}>File Distribution</Title>

          <Paper
            className='glass-card'
            p='lg'
            radius='lg'
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              minHeight: 400,
            }}
          >
            {statsLoading ? (
              <Stack gap='md'>
                <Skeleton height={40} />
                {[...Array(5)].map((_, i) => (
                  <Group key={i} justify='space-between'>
                    <Skeleton height={24} width={100} />
                    <Skeleton height={24} width={50} />
                  </Group>
                ))}
              </Stack>
            ) : Object.keys(stats!.sortTypeCount).length !== 0 ? (
              <ScrollArea.Autosize mah={350} type='auto'>
                <Stack gap='xs'>
                  {Object.entries(stats!.sortTypeCount)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count], i) => (
                      <Group
                        key={i}
                        justify='space-between'
                        p='sm'
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: i % 2 === 0 ? 'var(--glass-bg-alt)' : 'transparent',
                        }}
                      >
                        <Text fw={500} style={{ fontFamily: 'var(--font-mono)' }}>
                          {type}
                        </Text>
                        <Badge variant='light' size='sm'>
                          {count}
                        </Badge>
                      </Group>
                    ))}
                </Stack>
              </ScrollArea.Autosize>
            ) : (
              <Stack align='center' justify='center' h={300} gap='md'>
                <IconFiles size={48} style={{ opacity: 0.3 }} />
                <Stack gap='xs' align='center'>
                  <Text size='lg' fw={500} c='dimmed'>
                    No files yet
                  </Text>
                  <Text size='sm' c='dimmed' ta='center'>
                    Upload some files to see the distribution
                  </Text>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
