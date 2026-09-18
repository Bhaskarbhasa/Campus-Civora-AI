import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getDashboardRoute } from '../../utils/constants';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleCTA = (mode) => {
    if (isAuthenticated) {
      navigate(getDashboardRoute(user?.role));
    } else {
      navigate(mode === 'register' ? '/login?mode=register' : '/login');
    }
  };

  return (
    <div className="landing-page" style={{ 
      minHeight: '100vh', 
      background: 'var(--grad-hero)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Decorative Orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, var(--blue-glow) 0%, transparent 60%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, var(--cyan-glow) 0%, transparent 60%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Navbar */}
      <nav style={{
        padding: 'var(--space-6) var(--space-10)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--grad-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '900', color: '#FFFFFF',
            boxShadow: 'var(--shadow-cyan)'
          }}>
            C
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>
            Campus Civora
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={() => handleCTA('dashboard')}>
              Go to Dashboard
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => handleCTA('login')}>Login Portal</button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-10) var(--space-6)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--blue)',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-6)'
        }}>
          Official University Portal
        </div>
        
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: '800',
          lineHeight: '1.1',
          letterSpacing: '-1px',
          marginBottom: 'var(--space-6)',
          maxWidth: '900px'
        }}>
          Excellence in Campus <span style={{ 
            background: 'var(--grad-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Administration & Management</span>
        </h1>
        
        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          lineHeight: '1.6',
          marginBottom: 'var(--space-10)'
        }}>
          The comprehensive platform for students, faculty, and administrators. 
          Streamlining complaints, petitions, lost & found, and campus operations.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {isAuthenticated ? (
            <button className="btn btn-primary btn-lg" onClick={() => handleCTA('dashboard')} style={{ padding: '16px 40px', fontSize: '18px' }}>
              Enter Dashboard
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => handleCTA('login')} style={{ padding: '16px 40px', fontSize: '18px' }}>
              Access Login Portal
            </button>
          )}
        </div>
      </main>

      {/* Feature Cards Grid */}
      <section style={{
        padding: 'var(--space-16) var(--space-6) var(--space-20)',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          maxWidth: '1200px',
          width: '100%'
        }}>
          <FeatureCard 
            icon="📋" 
            title="Issue Routing" 
            desc="Automatically categorizes maintenance requests and routes them to the correct department instantly."
            color="var(--cyan)"
          />
          <FeatureCard 
            icon="⏱️" 
            title="SLA Enforcement" 
            desc="Ensures issues are resolved within designated timeframes, maintaining a high standard of living."
            color="var(--blue)"
          />
          <FeatureCard 
            icon="🤝" 
            title="Student Forums" 
            desc="Empower the student body to voice concerns through structured petitions and collaborative polls."
            color="var(--emerald)"
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-8)',
    boxShadow: 'var(--shadow-card)',
    transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
    cursor: 'default',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.borderColor = 'var(--border-muted)';
    e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.08), 0 0 20px ${color}20`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.borderColor = 'var(--border-subtle)';
    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
  }}
  >
    <div style={{
      width: '48px', height: '48px',
      borderRadius: 'var(--radius-lg)',
      background: 'rgba(0,0,0,0.03)',
      border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '24px',
      marginBottom: 'var(--space-5)',
      boxShadow: `0 0 16px ${color}15`
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
      {title}
    </h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
      {desc}
    </p>
  </div>
);

export default LandingPage;
