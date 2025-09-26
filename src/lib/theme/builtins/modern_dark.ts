const modern_dark = {
  name: 'Modern Dark',
  id: 'builtin:modern_dark',
  colorScheme: 'dark',
  colors: {
    // Primary brand colors - sophisticated blue-purple gradient
    primary: [
      '#f8fafc', // lightest
      '#e1e7fd',
      '#c3d0fc',
      '#a5b8fb',
      '#879fff', // main
      '#6366f1', // primary
      '#4f46e5',
      '#4338ca',
      '#3730a3',
      '#312e81', // darkest
    ],
    // Dark background colors - true dark with subtle variations
    dark: [
      '#ffffff',
      '#f1f3f4', // text on dark
      '#e5e7eb', // muted text
      '#374151', // borders
      '#1f2937', // cards/elevated
      '#111827', // secondary bg
      '#0f172a', // primary bg
      '#0c0e16', // deeper
      '#080b12', // deepest
      '#040507', // pure dark
    ],
    // Accent colors for highlights and interactions
    accent: [
      '#fef3f2',
      '#fee4e2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444', // main accent (red)
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d',
    ],
    // Success/positive actions
    success: [
      '#f0fdf4',
      '#dcfce7',
      '#bbf7d0',
      '#86efac',
      '#4ade80',
      '#22c55e', // main success
      '#16a34a',
      '#15803d',
      '#166534',
      '#14532d',
    ],
    // Warning states
    warning: [
      '#fffbeb',
      '#fef3c7',
      '#fde68a',
      '#fcd34d',
      '#fbbf24',
      '#f59e0b', // main warning
      '#d97706',
      '#b45309',
      '#92400e',
      '#78350f',
    ],
  },
  primaryColor: 'primary',
  mainBackgroundColor: '#0f172a',
  extraCss: `
    /* Modern Dark Theme Custom Styles */
    
    :root {
      /* Modern color palette */
      --modern-bg-primary: #0f172a;
      --modern-bg-secondary: #1e293b;
      --modern-surface-primary: rgba(15, 23, 42, 0.8);
      --modern-surface-secondary: rgba(30, 41, 59, 0.6);
      --modern-text-primary: #f8fafc;
      --modern-text-secondary: #cbd5e1;
      --modern-text-muted: #64748b;
      --modern-border: rgba(148, 163, 184, 0.1);
      --modern-accent-primary: #6366f1;
      --modern-success: #10b981;
      
      /* Modern gradients */
      --modern-accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      --modern-primary-gradient: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      --modern-success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --modern-text-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      
      /* Modern glass effects */
      --modern-glass-bg: rgba(15, 23, 42, 0.4);
      --modern-glass-subtle: rgba(30, 41, 59, 0.3);
      --modern-glass-border: 1px solid rgba(148, 163, 184, 0.1);
      --modern-backdrop-blur: blur(20px);
      
      /* Modern spacing and sizing */
      --modern-radius-sm: 8px;
      --modern-radius-md: 12px;
      --modern-radius-lg: 16px;
      --modern-radius-xl: 20px;
      --modern-shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      --modern-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      --modern-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      --modern-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    /* Glassmorphism effects */
    .glass-card {
      background: var(--modern-glass-bg);
      backdrop-filter: var(--modern-backdrop-blur);
      border: var(--modern-glass-border);
      border-radius: var(--modern-radius-lg);
      box-shadow: var(--modern-shadow-lg);
      transition: all 0.2s ease;
    }
    
    .glass-card:hover {
      background: rgba(30, 41, 59, 0.5);
      border-color: rgba(148, 163, 184, 0.2);
      transform: translateY(-2px);
      box-shadow: var(--modern-shadow-xl);
    }
    
    .glass-sidebar {
      background: rgba(17, 24, 39, 0.9);
      backdrop-filter: blur(16px);
      border-right: 1px solid rgba(99, 102, 241, 0.15);
    }
    
    /* Enhanced shadows */
    .elevated-card {
      box-shadow: 
        0 1px 3px 0 rgba(0, 0, 0, 0.3),
        0 4px 6px -1px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(99, 102, 241, 0.1);
    }
    
    .floating-card {
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.4),
        0 10px 15px -3px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(99, 102, 241, 0.15);
      transform: translateY(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .floating-card:hover {
      transform: translateY(-2px);
      box-shadow:
        0 8px 25px -5px rgba(0, 0, 0, 0.5),
        0 20px 25px -5px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(99, 102, 241, 0.2);
    }
    
    /* Terminal-inspired code elements */
    .terminal-text {
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Monaco', 'Consolas', monospace;
      font-feature-settings: 'liga' 1, 'calt' 1;
    }
    
    /* Smooth animations */
    .smooth-transition {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Custom scrollbar */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(99, 102, 241, 0.3);
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(99, 102, 241, 0.5);
    }
    
    /* Enhanced focus states */
    .focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: 2px;
    }
    
    /* Typography improvements */
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Better text hierarchy */
    .text-gradient {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    /* Subtle glow effects for interactive elements */
    .glow-on-hover:hover {
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    
    /* Loading states */
    .loading-shimmer {
      background: linear-gradient(
        90deg,
        rgba(15, 23, 42, 0) 0%,
        rgba(99, 102, 241, 0.1) 50%,
        rgba(15, 23, 42, 0) 100%
      );
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }
    
    /* Command palette styling */
    .command-palette {
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    
    /* File grid masonry layout */
    .masonry-grid {
      column-count: auto;
      column-width: 300px;
      column-gap: 1rem;
    }
    
    .masonry-item {
      break-inside: avoid;
      margin-bottom: 1rem;
    }
    
    @media (max-width: 768px) {
      .masonry-grid {
        column-width: 280px;
      }
    }
  `,
};

export default modern_dark;
