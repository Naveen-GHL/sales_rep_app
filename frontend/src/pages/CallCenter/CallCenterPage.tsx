import React, { useState } from 'react';
import {
  PhoneCall,
  Phone,
  PhoneForwarded,
  User,
  Users,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Delete,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { AgentAvailabilityToggle } from '../../components/calling/CallCenterComponents';

export const CallCenterPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { availability, initiateCall, simulateIncomingCall } = useCall();

  const [dialNumber, setDialNumber] = useState('+91 ');
  const [contactName, setContactName] = useState('');

  const handleDial = (digit: string) => {
    setDialNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setDialNumber(prev => prev.slice(0, -1));
  };

  const handleStartCall = () => {
    if (dialNumber.length > 5) {
      initiateCall(contactName || 'Direct Outbound Call', dialNumber);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <PhoneCall size={24} color="var(--primary-600)" /> Call Center Cockpit
          </h1>
          <p className="page-subtitle">
            Live agent routing, queue telemetry, and automated outbound dialer for {tenant?.name}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AgentAvailabilityToggle />
        </div>
      </div>

      {/* Real-Time Telemetry Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>QUEUE STATUS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            0 Calls Waiting
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Average hold time: 0s
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>AGENTS ONLINE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>
            4 Ready
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Tenant queue: {tenant?.slug.toUpperCase()}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>TODAY'S OUTBOUND</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-600)', marginTop: 6 }}>
            18 Calls
          </div>
          <div style={{ fontSize: 11, color: '#059669', marginTop: 4, fontWeight: 600 }}>
            Connect rate: 83.3%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>AVG TALK TIME</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>
            4m 12s
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Target: 3m - 6m
          </div>
        </div>
      </div>

      {/* Main Cockpit: Softphone Dialer on Left, Callback Queue on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Softphone Dialer */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Outbound Softphone</h3>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>● SIP Connected</span>
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-input"
              style={{ height: 42, fontSize: 16, fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' }}
              value={dialNumber}
              onChange={e => setDialNumber(e.target.value)}
              placeholder="+91 Phone number"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-input"
              style={{ fontSize: 12 }}
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Contact Name (optional)"
            />
          </div>

          {/* Keypad Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
              <button
                key={digit}
                type="button"
                className="btn btn-secondary"
                style={{ height: 48, fontSize: 18, fontWeight: 700 }}
                onClick={() => handleDial(digit)}
              >
                {digit}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              style={{ width: 48, height: 48 }}
              onClick={handleBackspace}
              title="Backspace"
            >
              <Delete size={18} />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, height: 48, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontSize: 15 }}
              onClick={handleStartCall}
            >
              <Phone size={18} /> Call Now
            </button>
          </div>
        </div>

        {/* Callback Queue & Quick Dial Prospects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Priority Callback Pipeline</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Inbound inquiries awaiting instant telephone outreach
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--primary-600)' }}
                onClick={() => simulateIncomingCall('Pravin Godbole', '+91 97410 88223')}
              >
                Simulate Call Event
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Dr. Rajesh Nambiar', phone: '+91 98451 12233', meta: 'High Net-Worth Investor • Commercial Office', priority: 'Urgent' },
                { name: 'Deepak & Sneha Kulkarni', phone: '+91 97312 88990', meta: 'Villa Plot Inquiry • Sarjapur East', priority: 'High' },
                { name: 'Manjunath Swamy', phone: '+91 98801 44556', meta: 'Weekend Site Visit Follow-up', priority: 'Medium' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.phone} • {item.meta}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    onClick={() => initiateCall(item.name, item.phone)}
                  >
                    <Phone size={13} /> Dial Contact
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
