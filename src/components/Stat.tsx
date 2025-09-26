import { Paper, Group, Title, Text, ThemeIcon, Stack } from '@mantine/core';
import { Icon } from '@tabler/icons-react';

export default function Stat({ title, value, Icon }: { title: string; value: any; Icon: Icon }) {
  return (
    <Paper
      p='lg'
      radius='lg'
      className='glass-card hover-lift'
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        transition: 'all 0.3s ease',
      }}
    >
      <Group justify='space-between' align='flex-start' mb='md'>
        <Stack gap={0}>
          <Text
            size='sm'
            c='dimmed'
            fw={500}
            style={{
              letterSpacing: '0.025em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
        </Stack>

        <ThemeIcon
          size={42}
          radius='lg'
          variant='gradient'
          style={{
            background: 'var(--accent-gradient)',
            boxShadow: '0 4px 20px rgba(var(--accent-rgb), 0.3)',
          }}
        >
          <Icon size='1.4rem' />
        </ThemeIcon>
      </Group>

      <Title
        order={2}
        fw={700}
        style={{
          fontSize: '1.875rem',
          background: 'var(--text-gradient)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}
      >
        {value}
      </Title>
    </Paper>
  );
}
