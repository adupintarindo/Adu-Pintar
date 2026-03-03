'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border shadow-lg backdrop-blur-sm font-sans',
          title: 'font-semibold text-sm',
          description: 'text-sm opacity-80',
          success: 'border-primary/30 bg-primary/5 text-primary',
          error: 'border-destructive/30 bg-destructive/5 text-destructive',
          warning: 'border-lime-500/30 bg-lime-50 text-lime-900 dark:bg-lime-950 dark:text-lime-200',
          info: 'border-accent/30 bg-accent/5 text-accent',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--glass-bg)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--glass-border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
