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
import './CallCenterPage.css';

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
    <div className="call-center-page">
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

        <div className="call-center-header-actions">
          <AgentAvailabilityToggle />
        </div>
      </div>

      {/* Real-Time Telemetry Bar */}
      <div className="call-center-telemetry-grid">
        <div className="card">
          <div className="call-center-telemetry-label">QUEUE STATUS</div>
          <div className="call-center-telemetry-val call-center-telemetry-val-green">
            <span className="call-center-pulse-dot" />
            0 Calls Waiting
          </div>
          <div className="call-center-telemetry-sub">
            Average hold time: 0s
          </div>
        </div>

        <div className="card">
          <div className="call-center-telemetry-label">AGENTS ONLINE</div>
          <div className="call-center-telemetry-val">
            4 Ready
          </div>
          <div className="call-center-telemetry-sub">
            Tenant queue: {tenant?.slug.toUpperCase()}
          </div>
        </div>

        <div className="card">
          <div className="call-center-telemetry-label">TODAY'S OUTBOUND</div>
          <div className="call-center-telemetry-val call-center-telemetry-val-primary">
            18 Calls
          </div>
          <div className="call-center-telemetry-sub-green">
            Connect rate: 83.3%
          </div>
        </div>

        <div className="card">
          <div className="call-center-telemetry-label">AVG TALK TIME</div>
          <div className="call-center-telemetry-val">
            4m 12s
          </div>
          <div className="call-center-telemetry-sub">
            Target: 3m - 6m
          </div>
        </div>
      </div>

      {/* Main Cockpit: Softphone Dialer on Left, Callback Queue on Right */}
      <div className="call-center-cockpit-layout">
        {/* Softphone Dialer */}
        <div className="card call-center-softphone-card">
          <div className="call-center-softphone-header">
            <h3 className="call-center-softphone-title">Outbound Softphone</h3>
            <span className="call-center-sip-badge">● SIP Connected</span>
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-input call-center-dial-input"
              value={dialNumber}
              onChange={e => setDialNumber(e.target.value)}
              placeholder="+91 Phone number"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-input call-center-contact-input"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Contact Name (optional)"
            />
          </div>

          {/* Keypad Grid */}
          <div className="call-center-keypad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
              <button
                key={digit}
                type="button"
                className="btn btn-secondary call-center-keypad-btn"
                onClick={() => handleDial(digit)}
              >
                {digit}
              </button>
            ))}
          </div>

          <div className="call-center-softphone-footer">
            <button
              type="button"
              className="btn btn-secondary btn-icon call-center-backspace-btn"
              onClick={handleBackspace}
              title="Backspace"
            >
              <Delete size={18} />
            </button>
            <button
              type="button"
              className="btn btn-primary call-center-call-btn"
              onClick={handleStartCall}
            >
              <Phone size={18} /> Call Now
            </button>
          </div>
        </div>

        {/* Callback Queue & Quick Dial Prospects */}
        <div className="call-center-queue-stack">
          <div className="card call-center-queue-card">
            <div className="call-center-queue-header">
              <div>
                <h3 className="call-center-queue-title">Priority Callback Pipeline</h3>
                <p className="call-center-queue-sub">
                  Inbound inquiries awaiting instant telephone outreach
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm call-center-simulate-btn"
                onClick={() => simulateIncomingCall('Pravin Godbole', '+91 97410 88223')}
              >
                Simulate Call Event
              </button>
            </div>

            <div className="call-center-prospects-list">
              {[
                { name: 'Dr. Rajesh Nambiar', phone: '+91 98451 12233', meta: 'High Net-Worth Investor • Commercial Office', priority: 'Urgent' },
                { name: 'Deepak & Sneha Kulkarni', phone: '+91 97312 88990', meta: 'Villa Plot Inquiry • Sarjapur East', priority: 'High' },
                { name: 'Manjunath Swamy', phone: '+91 98801 44556', meta: 'Weekend Site Visit Follow-up', priority: 'Medium' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="call-center-prospect-item"
                >
                  <div>
                    <div className="call-center-prospect-name">{item.name}</div>
                    <div className="call-center-prospect-meta">
                      {item.phone} • {item.meta}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm call-center-dial-item-btn"
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
