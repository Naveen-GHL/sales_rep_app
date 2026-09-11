import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Building2, UserCheck, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { login, switchPersona } = useAuth();
  const [email, setEmail] = useState('vikram@ghlindiatrust.com');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)',
        padding: 24,
      }}
    >
      <div
        className="card animate-slide-down"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: 36,
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24,
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
            }}
          >
            ⚡
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>NexusSales Platform</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Multi-Tenant Sales CRM & Real-Time Calling Engine
          </p>
        </div>

        {/* Demo Fast Login Presets */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#94a3b8',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            Quick One-Click Demo Sign-in
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', border: '1px solid #e2e8f0', padding: '8px 10px' }}
              onClick={() => switchPersona('company_admin', 'ghl')}
            >
              <Building2 size={14} color="#0284c7" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#0f172a' }}>GHL India Admin</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>Wealth / Investors</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', border: '1px solid #e2e8f0', padding: '8px 10px' }}
              onClick={() => switchPersona('company_admin', 'jamin')}
            >
              <Building2 size={14} color="#059669" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#0f172a' }}>Jamin Bazaar Admin</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>Plots / Operations</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', border: '1px solid #e2e8f0', padding: '8px 10px' }}
              onClick={() => switchPersona('sales_executive', 'ghl')}
            >
              <UserCheck size={14} color="#0284c7" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#0f172a' }}>GHL Sales Agent</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>Ananya Iyer</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', border: '1px solid #e2e8f0', padding: '8px 10px' }}
              onClick={() => switchPersona('super_admin')}
            >
              <Shield size={14} color="#8b5cf6" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#0f172a' }}>Super Admin</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>Operator Console</div>
              </div>
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '20px 0',
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          <span>or sign in with credentials</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#475569' }}>Work Email</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, color: '#94a3b8' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 36 }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ color: '#475569' }}>Password</label>
              <a href="#forgot" style={{ fontSize: 11, color: 'var(--primary-600)', textDecoration: 'none' }}>
                Forgot?
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, color: '#94a3b8' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 36 }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: 42, marginTop: 8 }}
          >
            Sign In to Organization <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
