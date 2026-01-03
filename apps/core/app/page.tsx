import Layout from './components/Layout'

export default function Home() {
  return (
    <Layout>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bem-vindo</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Redirecione para /start para começar.
        </p>
      </div>
    </Layout>
  )
}

