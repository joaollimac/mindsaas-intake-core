'use client'

import { usePathname } from 'next/navigation'

const steps = [
  { id: 'specify', label: 'Specify' },
  { id: 'pay', label: 'Pay' },
  { id: 'build', label: 'Build' },
  { id: 'delivered', label: 'Delivered' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Discreto */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem 2rem',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            Intake + Mini PRD
          </h1>
        </div>
      </header>

      {/* Stepper Textual */}
      <nav
        style={{
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem 2rem',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {steps.map((step, index) => {
            const isActive =
              (pathname === '/start' && index === 0) ||
              (pathname === '/quiz' && index === 1) ||
              (pathname === '/pay' && index === 1) ||
              (pathname === '/done' && index === 3) ||
              (pathname === '/' && index === 0)

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: isActive
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <span
                    style={{
                      color: 'var(--text-tertiary)',
                      fontSize: '0.75rem',
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  )
}

