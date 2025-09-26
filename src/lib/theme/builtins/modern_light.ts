const modern_light = {
  name: 'Modern Light',
  id: 'builtin:modern_light',
  colorScheme: 'light',
  colors: {
    // Primary brand colors - consistent with dark theme
    primary: [
      '#312e81', // darkest for light theme
      '#3730a3',
      '#4338ca',
      '#4f46e5',
      '#6366f1', // primary
      '#879fff',
      '#a5b8fb',
      '#c3d0fc',
      '#e1e7fd',
      '#f8fafc', // lightest
    ],
    // Light background colors
    gray: [
      '#f8fafc', // lightest bg
      '#f1f5f9', // secondary bg
      '#e2e8f0', // borders
      '#cbd5e1', // muted elements
      '#94a3b8', // muted text
      '#64748b', // text
      '#475569', // headings
      '#334155',
      '#1e293b',
      '#0f172a', // darkest text
    ],
    // Accent colors
    accent: [
      '#7f1d1d',
      '#991b1b',
      '#b91c1c',
      '#dc2626',
      '#ef4444', // main accent
      '#f87171',
      '#fca5a5',
      '#fecaca',
      '#fee4e2',
      '#fef3f2',
    ],
    // Success colors
    success: [
      '#14532d',
      '#166534',
      '#15803d',
      '#16a34a',
      '#22c55e', // main success
      '#4ade80',
      '#86efac',
      '#bbf7d0',
      '#dcfce7',
      '#f0fdf4',
    ],
    // Warning colors
    warning: [
      '#78350f',
      '#92400e',
      '#b45309',
      '#d97706',
      '#f59e0b', // main warning
      '#fbbf24',
      '#fcd34d',
      '#fde68a',
      '#fef3c7',
      '#fffbeb',
    ],
  },
  primaryColor: 'primary',
  mainBackgroundColor: '#f8fafc',
  extraCss: `
    /* Modern Light Theme Custom Styles */
    
    /* Glassmorphism effects for light theme */
    .glass-card {
      background: rgba(248, 250, 252, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 12px;
    }
    
    .glass-sidebar {
      background: rgba(241, 245, 249, 0.9);
      backdrop-filter: blur(16px);
      border-right: 1px solid rgba(99, 102, 241, 0.1);
    }
    
    /* Enhanced shadows for light theme */
    .elevated-card {
      box-shadow: 
        0 1px 3px 0 rgba(0, 0, 0, 0.1),
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 0 0 1px rgba(99, 102, 241, 0.05);
    }
    
    .floating-card {
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 10px 15px -3px rgba(0, 0, 0, 0.05),
        0 0 0 1px rgba(99, 102, 241, 0.1);
      transform: translateY(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .floating-card:hover {
      transform: translateY(-2px);
      box-shadow:
        0 8px 25px -5px rgba(0, 0, 0, 0.15),
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(99, 102, 241, 0.15);
    }
    
    /* Custom scrollbar for light theme */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(99, 102, 241, 0.2) transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(99, 102, 241, 0.2);
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(99, 102, 241, 0.4);
    }
    
    /* Loading shimmer for light theme */
    .loading-shimmer {
      background: linear-gradient(
        90deg,
        rgba(248, 250, 252, 0) 0%,
        rgba(99, 102, 241, 0.1) 50%,
        rgba(248, 250, 252, 0) 100%
      );
    }
    
    /* Command palette for light theme */
    .command-palette {
      background: rgba(248, 250, 252, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
  `,
};

export default modern_light;
