import type { Response } from '@/lib/api/response';
import type { SafeConfig } from '@/lib/config/safe';
import { fetchApi } from '@/lib/fetchApi';
import useAvatar from '@/lib/hooks/useAvatar';
import useLogin from '@/lib/hooks/useLogin';
import { Outlet, useLocation, Link, useLoaderData } from 'react-router-dom';
import { isAdministrator } from '@/lib/role';
import { useUserStore } from '@/lib/store/user';
import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Divider,
  Menu,
  NavLink,
  Paper,
  ScrollArea,
  Title,
  Text,
  Group,
  Stack,
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
  UnstyledButton,
} from '@mantine/core';
import { useClipboard, useHotkeys } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import {
  IconAdjustments,
  IconChevronDown,
  IconChevronRight,
  IconClipboardCopy,
  IconExternalLink,
  IconFileText,
  IconFileUpload,
  IconFiles,
  IconFolder,
  IconGraph,
  IconHome,
  IconLink,
  IconLogout,
  IconRefreshDot,
  IconSettingsFilled,
  IconShieldLockFilled,
  IconTags,
  IconUpload,
  IconUsersGroup,
  IconMenu2,
  IconX,
  IconSearch,
} from '@tabler/icons-react';
import { useState } from 'react';
import ConfigProvider from './ConfigProvider';
import VersionBadge from './VersionBadge';

type NavLinks = {
  label: string;
  icon: React.ReactNode;
  active: (path: string) => boolean;
  href?: string;
  links?: NavLinks[];
  if?: (user: Response['/api/user']['user'], config: SafeConfig) => boolean;
};

const navLinks: NavLinks[] = [
  {
    label: 'Home',
    icon: <IconHome size='1rem' />,
    active: (path: string) => path === '/dashboard',
    href: '/dashboard',
  },
  {
    label: 'Metrics',
    icon: <IconGraph size='1rem' />,
    active: (path: string) => path === '/dashboard/metrics',
    href: '/dashboard/metrics',
    if: (user, config) =>
      config.features.metrics.enabled &&
      (config.features.metrics.adminOnly ? isAdministrator(user?.role) : true),
  },
  {
    label: 'Files',
    icon: <IconFiles size='1rem' />,
    active: (path: string) => path === '/dashboard/files',
    href: '/dashboard/files',
  },
  {
    label: 'Folders',
    icon: <IconFolder size='1rem' />,
    active: (path: string) => path === '/dashboard/folders',
    href: '/dashboard/folders',
  },
  {
    label: 'Upload',
    icon: <IconUpload size='1rem' />,
    active: (path: string) => path.startsWith('/dashboard/upload'),
    links: [
      {
        label: 'File',
        icon: <IconFileUpload size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/file',
        href: '/dashboard/upload/file',
      },
      {
        label: 'Text',
        icon: <IconFileText size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/text',
        href: '/dashboard/upload/text',
      },
    ],
  },
  {
    label: 'URLs',
    icon: <IconLink size='1rem' />,
    active: (path: string) => path === '/dashboard/urls',
    href: '/dashboard/urls',
  },
  {
    label: 'Administrator',
    icon: <IconShieldLockFilled size='1rem' />,
    if: (user) => isAdministrator(user?.role),
    active: (path: string) => path.startsWith('/dashboard/admin'),
    links: [
      {
        label: 'Settings',
        icon: <IconAdjustments size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/settings',
        if: (user) => user?.role === 'SUPERADMIN',
        href: '/dashboard/admin/settings',
      },
      {
        label: 'Users',
        icon: <IconUsersGroup size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/users',
        href: '/dashboard/admin/users',
      },
      {
        label: 'Invites',
        icon: <IconTags size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/invites',
        href: '/dashboard/admin/invites',
        if: (_, config) => config.invites.enabled,
      },
    ],
  },
];

export default function Layout() {
  const { colorScheme } = useMantineColorScheme();
  const [opened, setOpened] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const modals = useModals();
  const clipboard = useClipboard();
  const setUser = useUserStore((s) => s.setUser);
  const location = useLocation();

  const loaderData = useLoaderData() as any; // Using any for now to avoid complex type issues
  const config = loaderData.config;

  const { user, mutate } = useLogin();
  const { avatar } = useAvatar();

  // Keyboard shortcuts
  useHotkeys([
    [
      'mod+K',
      () => {
        // TODO: Open command palette
        showNotification({
          title: 'Command Palette',
          message: 'Command palette will be implemented soon!',
          color: 'blue',
        });
      },
    ],
    ['mod+\\', () => setCollapsed((c) => !c)],
  ]);

  const copyToken = () => {
    modals.openConfirmModal({
      title: 'Copy token?',
      children:
        'Are you sure you want to copy your token? Your token can interact with all parts of NodeCast. Do not share this token with anyone.',
      labels: { confirm: 'Copy', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.error,
            color: 'red',
            icon: <IconClipboardCopy size='1rem' />,
          });
        } else {
          clipboard.copy(data?.token ?? '');
          showNotification({
            title: 'Copied',
            message: 'Your token has been copied to your clipboard.',
            color: 'green',
            icon: <IconClipboardCopy size='1rem' />,
          });
        }
      },
    });
  };

  const refreshToken = () => {
    modals.openConfirmModal({
      title: 'Refresh token?',
      children:
        'Are you sure you want to refresh your token? Once you refresh/reset your token, you will need to update any scripts or applications that use your token.',
      labels: { confirm: 'Refresh', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token', 'PATCH');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.error,
            color: 'red',
            icon: <IconRefreshDot size='1rem' />,
          });
        } else {
          setUser(data?.user);
          mutate(data as Response['/api/user']);

          showNotification({
            title: 'Refreshed',
            message: 'Your token has been refreshed.',
            color: 'green',
            icon: <IconRefreshDot size='1rem' />,
          });
        }
      },
    });
  };

  const sidebarWidth = collapsed ? 70 : 280;

  return (
    <AppShell
      navbar={{
        breakpoint: 'sm',
        width: { sm: sidebarWidth, lg: sidebarWidth },
        collapsed: { mobile: !opened },
      }}
      header={{ height: 70 }}
      styles={{
        navbar: {
          background: colorScheme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${
            colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'
          }`,
        },
        header: {
          background: colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${
            colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'
          }`,
        },
        main: {
          background:
            colorScheme === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        },
      }}
    >
      {/* Modern Header */}
      <AppShell.Header px='xl'>
        <Group h='100%' justify='space-between'>
          <Group>
            <Burger opened={opened} onClick={() => setOpened((o) => !o)} size='sm' hiddenFrom='sm' />

            <Group gap='sm'>
              {config.website.titleLogo && (
                <Avatar src={config.website.titleLogo} alt='NodeCast logo' radius='md' size='lg' />
              )}

              <div>
                <Title size={28} fw={700} className='text-gradient' visibleFrom='sm'>
                  {config.website.title.trim()}
                </Title>
                <Text size='xs' c='dimmed' visibleFrom='sm'>
                  File sharing platform
                </Text>
              </div>
            </Group>
          </Group>

          {/* Command palette trigger */}
          <Group gap='sm'>
            <UnstyledButton
              onClick={() => {
                showNotification({
                  title: 'Command Palette',
                  message: 'Press Cmd/Ctrl + K to open command palette (coming soon!)',
                  color: 'blue',
                });
              }}
              className='glass-card'
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              visibleFrom='sm'
            >
              <IconSearch size={16} />
              <Text size='sm' c='dimmed'>
                Search...
              </Text>
              <Text size='xs' c='dimmed' className='terminal-text'>
                ⌘K
              </Text>
            </UnstyledButton>

            {/* User Menu */}
            <Menu shadow='lg' width={280} position='bottom-end'>
              <Menu.Target>
                <UnstyledButton
                  className='glass-card floating-hover'
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {avatar ? (
                    <Avatar src={avatar} radius='md' size='sm' alt={user?.username ?? 'User avatar'} />
                  ) : (
                    <IconSettingsFilled size='1.2rem' />
                  )}
                  <Text size='sm' fw={500} visibleFrom='sm'>
                    {user?.username}
                  </Text>
                  <IconChevronDown size='0.8rem' />
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown className='glass-card'>
                <Menu.Label>
                  <Group gap='xs'>
                    <Text fw={500}>{user?.username}</Text>
                    {isAdministrator(user?.role) && (
                      <Text size='xs' c='blue' fw={500}>
                        Admin
                      </Text>
                    )}
                  </Group>
                </Menu.Label>

                <Menu.Item leftSection={<IconClipboardCopy size='1rem' />} onClick={copyToken}>
                  Copy API token
                </Menu.Item>
                <Menu.Item leftSection={<IconRefreshDot size='1rem' />} onClick={refreshToken}>
                  Refresh token
                </Menu.Item>
                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconSettingsFilled size='1rem' />}
                  component={Link}
                  to='/dashboard/settings'
                >
                  User Settings
                </Menu.Item>

                {user?.role === 'SUPERADMIN' && (
                  <Menu.Item
                    leftSection={<IconAdjustments size='1rem' />}
                    component={Link}
                    to='/dashboard/admin/settings'
                  >
                    Server Settings
                  </Menu.Item>
                )}

                <Menu.Divider />
                <Menu.Item
                  color='red'
                  leftSection={<IconLogout size='1rem' />}
                  component={Link}
                  to='/auth/logout'
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Modern Sidebar */}
      <AppShell.Navbar p={0} className='custom-scroll'>
        <Stack gap={0} h='100%'>
          {/* Sidebar Header */}
          <Box p='lg'>
            <Group justify='space-between' mb='md'>
              <Title hiddenFrom='sm' size={20} fw={700} className='text-gradient'>
                {config.website.title.trim()}
              </Title>

              <ActionIcon onClick={() => setCollapsed((c) => !c)} variant='subtle' size='sm' visibleFrom='sm'>
                {collapsed ? <IconMenu2 size={16} /> : <IconX size={16} />}
              </ActionIcon>
            </Group>

            <Divider hiddenFrom='sm' />
          </Box>

          {/* Navigation Links */}
          <ScrollArea flex={1} px='sm'>
            <Stack gap='xs'>
              {navLinks
                .filter((link) => !link.if || link.if(user as Response['/api/user']['user'], config))
                .map((link) => {
                  if (!link.links) {
                    const isActive = location.pathname === link.href;
                    return (
                      <Tooltip key={link.label} label={link.label} position='right' disabled={!collapsed}>
                        <NavLink
                          label={collapsed ? '' : link.label}
                          leftSection={link.icon}
                          variant={isActive ? 'filled' : 'subtle'}
                          active={isActive}
                          component={Link}
                          to={link.href || ''}
                          className='smooth-transition'
                          styles={{
                            root: {
                              borderRadius: 12,
                              margin: '2px 0',
                              padding: collapsed ? '12px' : '12px 16px',
                              minHeight: collapsed ? 44 : 48,
                              justifyContent: collapsed ? 'center' : 'flex-start',
                            },
                            label: {
                              fontSize: 14,
                              fontWeight: 500,
                            },
                            section: {
                              minWidth: 20,
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  } else {
                    const hasActiveChild = link.links?.some((sublink) => location.pathname === sublink.href);
                    const isExpanded = link.active(location.pathname);

                    return (
                      <Box key={link.label}>
                        <Tooltip label={link.label} position='right' disabled={!collapsed}>
                          <NavLink
                            label={collapsed ? '' : link.label}
                            leftSection={link.icon}
                            rightSection={collapsed ? null : <IconChevronRight size='0.8rem' />}
                            variant={hasActiveChild ? 'light' : 'subtle'}
                            defaultOpened={isExpanded && !collapsed}
                            className='smooth-transition'
                            styles={{
                              root: {
                                borderRadius: 12,
                                margin: '2px 0',
                                padding: collapsed ? '12px' : '12px 16px',
                                minHeight: collapsed ? 44 : 48,
                                justifyContent: collapsed ? 'center' : 'flex-start',
                              },
                              label: {
                                fontSize: 14,
                                fontWeight: 500,
                              },
                              section: {
                                minWidth: 20,
                              },
                            }}
                          >
                            {!collapsed &&
                              link.links
                                ?.filter(
                                  (sublink) =>
                                    !sublink.if || sublink.if(user as Response['/api/user']['user'], config),
                                )
                                .map((sublink) => {
                                  const isSubActive = location.pathname === sublink.href;
                                  return (
                                    <NavLink
                                      key={sublink.label}
                                      label={sublink.label}
                                      leftSection={sublink.icon}
                                      variant={isSubActive ? 'filled' : 'subtle'}
                                      active={isSubActive}
                                      component={Link}
                                      to={sublink.href || ''}
                                      className='smooth-transition'
                                      styles={{
                                        root: {
                                          borderRadius: 8,
                                          margin: '2px 0',
                                          padding: '8px 12px',
                                          marginLeft: 12,
                                        },
                                        label: {
                                          fontSize: 13,
                                          fontWeight: 450,
                                        },
                                      }}
                                    />
                                  );
                                })}
                          </NavLink>
                        </Tooltip>
                      </Box>
                    );
                  }
                })}
            </Stack>
          </ScrollArea>

          {/* Sidebar Footer */}
          <Box p='sm'>
            <Stack gap='xs'>
              <VersionBadge />

              {!collapsed && (
                <>
                  <Divider />
                  <Text size='xs' c='dimmed' ta='center'>
                    Press ⌘K for quick actions
                  </Text>
                </>
              )}

              {/* External Links */}
              {config.website.externalLinks.length > 0 && !collapsed && (
                <Box>
                  <Divider my='sm' />
                  <Stack gap='xs'>
                    {config.website.externalLinks.map((link: any, i: number) => (
                      <NavLink
                        key={i}
                        label={link.name}
                        leftSection={<IconExternalLink size='0.9rem' />}
                        variant='subtle'
                        component={Link}
                        to={link.url}
                        target='_blank'
                        className='smooth-transition'
                        styles={{
                          root: {
                            borderRadius: 8,
                            padding: '8px 12px',
                          },
                          label: {
                            fontSize: 12,
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </AppShell.Navbar>

      {/* Modern Main Content */}
      <AppShell.Main>
        <ConfigProvider data={loaderData}>
          <Box p='xl' className='custom-scroll'>
            <Paper
              className='glass-card floating-card'
              p='xl'
              radius='xl'
              style={{
                minHeight: 'calc(100vh - 180px)',
                border:
                  colorScheme === 'dark'
                    ? '1px solid rgba(99, 102, 241, 0.2)'
                    : '1px solid rgba(99, 102, 241, 0.15)',
              }}
            >
              <Outlet />
            </Paper>
          </Box>
        </ConfigProvider>
      </AppShell.Main>
    </AppShell>
  );
}
