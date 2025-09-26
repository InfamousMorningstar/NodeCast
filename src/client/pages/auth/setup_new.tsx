import { type Response } from '@/lib/api/response';
import { fetchApi } from '@/lib/fetchApi';
import { useTitle } from '@/lib/hooks/useTitle';
import {
  Anchor,
  Button,
  Code,
  Group,
  PasswordInput,
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
      <Anchor href={href} target='_blank' rel='noopener noreferrer' className="config-link">
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

  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (value.length < 1 ? 'Username must have at least 1 character' : null),
      password: (value) => (value.length < 1 ? 'Password must have at least 1 character' : null),
    },
  });

  const nextStep = () => setActive((current) => (current < 2 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const onSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);

    const res = await fetchApi<Response['/api/auth/setup']>('/api/auth/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (res.success) {
      await mutate('/api/user/me');
      notifications.show({
        title: 'Success!',
        message: 'Your account has been created successfully.',
        color: 'green',
        icon: <IconCheck size='1rem' />,
      });

      navigate('/dashboard');
    } else {
      notifications.show({
        title: 'Failed to create user',
        message: res.error,
        color: 'red',
        icon: <IconX size='1rem' />,
      });
    }
    setLoading(false);
  };

  return (
    <div className="setup-container">
      {/* Animated background */}
      <div className="setup-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>
      
      {/* Main content */}
      <div className="setup-content">
        <div className="setup-card">
          {/* Header */}
          <div className="setup-header">
            <div className="setup-logo">
              <div className="logo-gradient">NC</div>
            </div>
            <Title className="setup-title">Welcome to NodeCast</Title>
            <Text className="setup-subtitle">Let's set up your high-performance file server</Text>
          </div>

          {/* Stepper */}
          <div className="setup-stepper">
            <Stepper 
              active={active} 
              onStepClick={setActive}
              size="lg"
              iconSize={48}
              styles={{
                root: { margin: '2rem 0' },
                step: {
                  backgroundColor: 'transparent',
                  border: '2px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                stepIcon: {
                  backgroundColor: 'var(--modern-accent-primary)',
                  border: '3px solid rgba(99, 102, 241, 0.3)',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                stepCompletedIcon: {
                  backgroundColor: 'var(--modern-success)',
                  border: '3px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '16px',
                },
                stepLabel: {
                  color: 'var(--modern-text-primary)',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  marginTop: '0.75rem',
                },
                stepDescription: {
                  color: 'var(--modern-text-secondary)',
                  fontSize: '0.95rem',
                  marginTop: '0.25rem',
                },
                separator: {
                  backgroundColor: 'rgba(148, 163, 184, 0.2)',
                  height: '2px',
                  borderRadius: '1px',
                },
              }}
            >
              <Stepper.Step 
                label="Welcome" 
                description="Setup introduction"
                className="stepper-step"
              >
                <div className="step-content">
                  <div className="step-hero">
                    <div className="hero-icon">🚀</div>
                    <Title order={2} className="step-title">
                      Ready to Launch Your File Server?
                    </Title>
                    <Text className="step-description">
                      NodeCast is a high-performance, modern file server with advanced features
                      like real-time sync, version control, and enterprise-grade security.
                    </Text>
                  </div>

                  <div className="info-grid">
                    <div className="info-card">
                      <div className="info-icon">📚</div>
                      <Title order={4} className="info-title">Documentation</Title>
                      <Text className="info-text">
                        Essential resources to get you started with NodeCast
                      </Text>
                      
                      <div className="info-links">
                        <LinkToDoc 
                          href='https://github.com/InfamousMorningstar/NodeCast' 
                          title='Configuration Guide'
                        >
                          Learn how to configure NodeCast for your needs
                        </LinkToDoc>
                        
                        <LinkToDoc
                          href='https://github.com/InfamousMorningstar/NodeCast#readme'
                          title='Complete Documentation'
                        >
                          Full setup and usage guide with examples
                        </LinkToDoc>
                      </div>
                    </div>

                    <div className="info-card">
                      <div className="info-icon">⚙️</div>
                      <Title order={4} className="info-title">Configuration</Title>
                      <Text className="info-text">
                        Most settings are managed through the web dashboard
                      </Text>
                      
                      <div className="config-info">
                        <Text className="config-text">
                          As a super-admin, access <strong>Server Settings</strong> via your username menu
                          to configure your instance.
                        </Text>
                        
                        <Text className="config-text">
                          Environment variables can be edited in <Code className="inline-code">.env</Code> or{' '}
                          <Code className="inline-code">docker-compose.yml</Code> files.
                        </Text>
                        
                        <Text className="config-text">
                          View all options in our{' '}
                          <Anchor
                            href='https://github.com/InfamousMorningstar/NodeCast#configuration'
                            target='_blank'
                            rel='noopener noreferrer'
                            className="config-link"
                          >
                            configuration guide
                          </Anchor>
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    size="xl"
                    className="primary-button"
                    onClick={nextStep}
                    rightSection={<IconArrowForwardUp size={20} />}
                  >
                    Let's Get Started
                  </Button>
                </div>
              </Stepper.Step>
              
              <Stepper.Step 
                label="Create Account" 
                description="Super-admin setup"
                className="stepper-step"
              >
                <div className="step-content">
                  <div className="step-hero">
                    <div className="hero-icon">👤</div>
                    <Title order={2} className="step-title">
                      Create Your Super-Admin Account
                    </Title>
                    <Text className="step-description">
                      This account will have full administrative privileges and access to all server settings.
                    </Text>
                  </div>

                  <div className="form-container">
                    <Stack gap="lg">
                      <TextInput
                        label="Username"
                        placeholder="Enter your username"
                        size="lg"
                        className="form-input"
                        styles={{
                          label: { 
                            color: 'var(--modern-text-primary)', 
                            fontWeight: '600',
                            fontSize: '1rem',
                            marginBottom: '0.5rem'
                          },
                          input: {
                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                            border: '2px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '12px',
                            color: 'var(--modern-text-primary)',
                            fontSize: '1rem',
                            padding: '0.75rem 1rem',
                            transition: 'all 0.2s ease',
                            '&:focus': {
                              borderColor: 'var(--modern-accent-primary)',
                              backgroundColor: 'rgba(30, 41, 59, 0.7)',
                              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                            },
                            '&::placeholder': {
                              color: 'var(--modern-text-muted)',
                            }
                          }
                        }}
                        {...form.getInputProps('username')}
                      />

                      <PasswordInput
                        label="Password"
                        placeholder="Create a secure password"
                        size="lg"
                        className="form-input"
                        styles={{
                          label: { 
                            color: 'var(--modern-text-primary)', 
                            fontWeight: '600',
                            fontSize: '1rem',
                            marginBottom: '0.5rem'
                          },
                          input: {
                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                            border: '2px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '12px',
                            color: 'var(--modern-text-primary)',
                            fontSize: '1rem',
                            padding: '0.75rem 1rem',
                            transition: 'all 0.2s ease',
                            '&:focus': {
                              borderColor: 'var(--modern-accent-primary)',
                              backgroundColor: 'rgba(30, 41, 59, 0.7)',
                              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                            }
                          },
                          innerInput: {
                            backgroundColor: 'transparent',
                          },
                          visibilityToggle: {
                            color: 'var(--modern-text-secondary)',
                            '&:hover': {
                              color: 'var(--modern-text-primary)',
                            }
                          }
                        }}
                        {...form.getInputProps('password')}
                      />
                    </Stack>
                  </div>

                  <div className="button-group">
                    <Button
                      size="lg"
                      variant="outline"
                      className="secondary-button"
                      onClick={prevStep}
                      leftSection={<IconArrowBackUp size={20} />}
                    >
                      Back
                    </Button>

                    <Button
                      size="lg"
                      className={form.isValid() ? "primary-button" : "disabled-button"}
                      onClick={nextStep}
                      disabled={!form.isValid()}
                      rightSection={<IconArrowForwardUp size={20} />}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </Stepper.Step>
              
              <Stepper.Completed>
                <div className="step-content">
                  <div className="step-hero">
                    <div className="hero-icon completion-icon">🎉</div>
                    <Title order={2} className="step-title completion-title">
                      Ready to Launch!
                    </Title>
                    <Text className="step-description">
                      Your NodeCast server is configured and ready to go. 
                      Click finish to create your account and start using your file server.
                    </Text>
                  </div>

                  <div className="completion-info">
                    <div className="success-card">
                      <Text className="success-text">
                        🚀 <strong>What happens next?</strong><br/>
                        • Your super-admin account will be created<br/>
                        • You'll be redirected to the dashboard<br/>
                        • Start uploading and managing your files!
                      </Text>
                    </div>
                  </div>
                  
                  <div className="button-group">
                    <Button
                      size="lg"
                      variant="outline"
                      className="secondary-button"
                      onClick={prevStep}
                      loading={loading}
                      leftSection={<IconArrowBackUp size={20} />}
                    >
                      Back
                    </Button>

                    <Button
                      size="lg"
                      loading={loading}
                      className="success-button"
                      onClick={() => form.onSubmit(onSubmit)()}
                      rightSection={<IconCheck size={20} />}
                    >
                      {loading ? 'Creating Account...' : 'Finish Setup'}
                    </Button>
                  </div>
                </div>
              </Stepper.Completed>
            </Stepper>
          </div>
        </div>
      </div>
    </div>
  );
}