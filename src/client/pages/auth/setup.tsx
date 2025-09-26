import { type Response } from '@/lib/api/response';
import { fetchApi } from '@/lib/fetchApi';
import { useTitle } from '@/lib/hooks/useTitle';
import {
  Anchor,
  Button,
  Code,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowBackUp, IconArrowForwardUp, IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import { mutate } from 'swr';

function LinkToDoc({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Text>
      <Anchor href={href} target='_blank' rel='noopener noreferrer'>
        {title}
      </Anchor>{' '}
      {children}
    </Text>
  );
}

export async function loader() {
  const res = await fetch('/api/server/public');
  if (!res.ok) {
    throw new Response('Failed to fetch server settings', { status: res.status });
  }

  const data = await res.json();
  if (!data.firstSetup) return redirect('/auth/login');

  return {};
}

export function Component() {
  useTitle('Setup');

  const navigate = useNavigate();

  const [active, setActive] = useState(0);
  const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (value.length < 1 ? 'Username is required' : null),
      password: (value) => (value.length < 1 ? 'Password is required' : null),
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    setLoading(true);

    const { error } = await fetchApi('/api/setup', 'POST', {
      username: values.username,
      password: values.password,
    });

    if (error) {
      notifications.show({
        title: 'Error',
        message: error.error,
        color: 'red',
        icon: <IconX size='1rem' />,
      });

      setLoading(false);
      setActive(2);
    } else {
      notifications.show({
        title: 'Setup complete!',
        message: 'Logging in to new user...',
        color: 'green',
        loading: true,
      });

      const { data, error } = await fetchApi<Response['/api/auth/login']>('/api/auth/login', 'POST', {
        username: values.username,
        password: values.password,
      });

      if (error) {
        notifications.show({
          title: 'Error',
          message: error.error,
          color: 'red',
          icon: <IconX size='1rem' />,
        });

        setLoading(false);
        setActive(2);
      } else {
        mutate('/api/user', data as Response['/api/user']);
        navigate('/dashboard');
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--modern-bg-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'var(--modern-accent-gradient)',
        borderRadius: '50%',
        opacity: '0.1',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'var(--modern-primary-gradient)',
        borderRadius: '50%',
        opacity: '0.1',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      
      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Modern glass card */}
        <div className="glass-card" style={{
          padding: '2rem',
          marginTop: '2rem',
          background: 'var(--modern-glass-bg)',
          backdropFilter: 'var(--modern-backdrop-blur)',
          border: 'var(--modern-glass-border)',
          borderRadius: 'var(--modern-radius-xl)',
          boxShadow: 'var(--modern-shadow-xl)'
        }}>
          <Stepper 
            active={active} 
            onStepClick={setActive} 
            styles={{
              step: {
                backgroundColor: 'var(--modern-surface-secondary)',
                border: '1px solid var(--modern-border)',
                borderRadius: 'var(--modern-radius-lg)'
              },
              stepIcon: {
                backgroundColor: 'var(--modern-accent-primary)',
                color: 'var(--modern-text-primary)',
                border: 'none'
              },
              stepCompletedIcon: {
                backgroundColor: 'var(--modern-success)',
                color: 'white'
              },
              stepLabel: {
                color: 'var(--modern-text-primary)',
                fontWeight: 600,
                fontSize: '1.1rem'
              },
              stepDescription: {
                color: 'var(--modern-text-secondary)'
              },
              separator: {
                backgroundColor: 'var(--modern-border)'
              }
            }}
          >
            <Stepper.Step label='Welcome!' description='Setup NodeCast'>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Title 
                  order={1} 
                  style={{ 
                    background: 'var(--modern-text-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '3rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem'
                  }}
                >
                  Welcome to NodeCast!
                </Title>
                <Text size="lg" c="var(--modern-text-secondary)">
                  Let's get your high-performance file server ready
                </Text>
              </div>

              <SimpleGrid spacing='xl' cols={{ base: 1, sm: 2 }}>
                <div className="glass-card" style={{
                  padding: '1.5rem',
                  background: 'var(--modern-glass-subtle)',
                  border: 'var(--modern-glass-border)',
                  borderRadius: 'var(--modern-radius-lg)',
                  height: '100%'
                }}>
                  <Title 
                    order={3} 
                    style={{ 
                      color: 'var(--modern-text-primary)', 
                      marginBottom: '1rem',
                      fontSize: '1.5rem'
                    }}
                  >
                    📚 Documentation
                  </Title>
                  <Text c="var(--modern-text-secondary)" mb="md">
                    Essential resources to get you started with NodeCast:
                  </Text>

                  <Stack gap="sm">
                    <LinkToDoc href='https://github.com/InfamousMorningstar/NodeCast' title='Configuration'>
                      Configuring NodeCast to your needs
                    </LinkToDoc>

                    <LinkToDoc
                      href='https://github.com/InfamousMorningstar/NodeCast#readme'
                      title='NodeCast Documentation'
                    >
                      Complete setup and usage guide
                    </LinkToDoc>
                  </Stack>
                </div>

                <div className="glass-card" style={{
                  padding: '1.5rem',
                  background: 'var(--modern-glass-subtle)',
                  border: 'var(--modern-glass-border)',
                  borderRadius: 'var(--modern-radius-lg)',
                  height: '100%'
                }}>
                  <Title 
                    order={3} 
                    style={{ 
                      color: 'var(--modern-text-primary)', 
                      marginBottom: '1rem',
                      fontSize: '1.5rem'
                    }}
                  >
                    ⚙️ Configuration
                  </Title>
                  
                  <Text c="var(--modern-text-secondary)" mb="sm">
                    Most configuration is managed through the dashboard. As a super-admin, click your username → 
                    <strong> Server Settings</strong> to configure your instance.
                  </Text>

                  <Text c="var(--modern-text-secondary)" mb="sm">
                    Environment variables can be edited in <Code>.env</Code> or <Code>docker-compose.yml</Code> files.
                  </Text>

                  <Text c="var(--modern-text-secondary)">
                    View all available options in our{' '}
                    <Anchor
                      href='https://github.com/InfamousMorningstar/NodeCast#configuration'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={{ color: 'var(--modern-accent-primary)' }}
                    >
                      configuration guide
                    </Anchor>
                  </Text>
                </div>
              </SimpleGrid>

              <Button
                mt='xl'
                fullWidth
                rightSection={<IconArrowForwardUp size='1.25rem' />}
                size='lg'
                onClick={nextStep}
                styles={{
                  root: {
                    background: 'var(--modern-accent-gradient)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    height: '50px',
                    borderRadius: 'var(--modern-radius-lg)',
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                Continue
              </Button>
            </Stepper.Step>
            
            <Stepper.Step label='Create user' description='Create a super-admin account'>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Title 
                  order={2} 
                  style={{ 
                    color: 'var(--modern-text-primary)',
                    fontSize: '2rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem'
                  }}
                >
                  Create your super-admin account
                </Title>
                <Text size="lg" c="var(--modern-text-secondary)">
                  This account will have full administrative privileges
                </Text>
              </div>

              <Stack gap='lg' maw={400} mx="auto">
                <TextInput
                  label='Username'
                  placeholder='Enter a username...'
                  size="lg"
                  styles={{
                    label: { color: 'var(--modern-text-primary)', fontWeight: 600 },
                    input: {
                      backgroundColor: 'var(--modern-surface-secondary)',
                      border: '1px solid var(--modern-border)',
                      borderRadius: 'var(--modern-radius-md)',
                      color: 'var(--modern-text-primary)',
                      '&:focus': {
                        borderColor: 'var(--modern-accent-primary)',
                        boxShadow: '0 0 0 1px var(--modern-accent-primary)'
                      }
                    }
                  }}
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label='Password'
                  placeholder='Enter a secure password...'
                  size="lg"
                  styles={{
                    label: { color: 'var(--modern-text-primary)', fontWeight: 600 },
                    input: {
                      backgroundColor: 'var(--modern-surface-secondary)',
                      border: '1px solid var(--modern-border)',
                      borderRadius: 'var(--modern-radius-md)',
                      color: 'var(--modern-text-primary)',
                      '&:focus': {
                        borderColor: 'var(--modern-accent-primary)',
                        boxShadow: '0 0 0 1px var(--modern-accent-primary)'
                      }
                    },
                    innerInput: {
                      backgroundColor: 'transparent'
                    }
                  }}
                  {...form.getInputProps('password')}
                />
              </Stack>

              <Group justify='space-between' mt='2rem'>
                <Button
                  leftSection={<IconArrowBackUp size='1.25rem' />}
                  size='lg'
                  onClick={prevStep}
                  variant="outline"
                  styles={{
                    root: {
                      borderColor: 'var(--modern-border)',
                      color: 'var(--modern-text-secondary)',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'var(--modern-surface-secondary)',
                        borderColor: 'var(--modern-accent-primary)'
                      }
                    }
                  }}
                >
                  Back
                </Button>

                <Button
                  rightSection={<IconArrowForwardUp size='1.25rem' />}
                  size='lg'
                  onClick={nextStep}
                  disabled={!form.isValid()}
                  styles={{
                    root: {
                      background: form.isValid() ? 'var(--modern-accent-gradient)' : 'var(--modern-surface-secondary)',
                      border: 'none',
                      color: form.isValid() ? 'white' : 'var(--modern-text-muted)',
                      fontWeight: 600,
                      '&:disabled': {
                        backgroundColor: 'var(--modern-surface-secondary)',
                        color: 'var(--modern-text-muted)'
                      }
                    }
                  }}
                >
                  Continue
                </Button>
              </Group>
            </Stepper.Step>
            
            <Stepper.Completed>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Title 
                  order={2} 
                  style={{ 
                    color: 'var(--modern-text-primary)',
                    fontSize: '2rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem'
                  }}
                >
                  🎉 Setup Complete!
                </Title>
                <Text size="lg" c="var(--modern-text-secondary)">
                  Ready to launch your NodeCast file server
                </Text>
              </div>

              <div className="glass-card" style={{
                padding: '1.5rem',
                background: 'var(--modern-glass-subtle)',
                border: 'var(--modern-glass-border)',
                borderRadius: 'var(--modern-radius-lg)',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <Text c="var(--modern-text-secondary)" size="lg">
                  Clicking <strong>Finish</strong> will create your super-admin account and redirect you to the dashboard.
                  Welcome to the future of file sharing! 🚀
                </Text>
              </div>
              
              <Group justify='space-between'>
                <Button
                  leftSection={<IconArrowBackUp size='1.25rem' />}
                  size='lg'
                  onClick={prevStep}
                  loading={loading}
                  variant="outline"
                  styles={{
                    root: {
                      borderColor: 'var(--modern-border)',
                      color: 'var(--modern-text-secondary)',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'var(--modern-surface-secondary)',
                        borderColor: 'var(--modern-accent-primary)'
                      }
                    }
                  }}
                >
                  Back
                </Button>

                <Button
                  rightSection={<IconCheck size='1.25rem' />}
                  size='lg'
                  loading={loading}
                  onClick={() => form.onSubmit(onSubmit)()}
                  styles={{
                    root: {
                      background: 'var(--modern-success-gradient)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      minWidth: '140px'
                    }
                  }}
                >
                  Finish
                </Button>
              </Group>
            </Stepper.Completed>
          </Stepper>
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'Setup';
