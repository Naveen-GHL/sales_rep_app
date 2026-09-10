import React, { useState } from 'react';
import { PhoneCall, ShieldCheck, Radio, Server, Check } from 'lucide-react';
import { TENANTS } from '../../../services/mockData';

export const PlatformCallConfigPage: React.FC = () => {
  const [provider, setProvider] = useState('Twilio Elastic SIP Trunking');
  const [recordingRetention, setRecordingRetention] = useState('180 Days');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#ffffff' }}>
            <PhoneCall size={24} color="#8b5cf6" /> Telephony & Trunking Configuration
          </h1>
          <p className="page-subtitle" style={{ color: '#94a3b8' }}>
            Virtual DID phone number routing maps, carrier trunks, and tenant isolation policies.
          </p>
        </div>
      </div>

      {/* DID Mapping Table */}
      <div className="card" style={{ padding: 0, backgroundColor: '#0f172a', borderColor: '#334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Virtual DID Inbound Mapping</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#cbd5e1' }}>
          <thead>
            <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left' }}>Inbound Virtual DID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mapped Tenant Organization</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Routing Strategy</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Recording & Transcription</th>
              <th style={{ padding: '12px 20px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '14px 20px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                +91 80 4700 8001
              </td>
              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#38bdf8' }}>
                GHL India Ventures
              </td>
              <td style={{ padding: '14px 16px' }}>VIP Priority / Wealth Advisory Queue</td>
              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Active (Whisper AI)</span>
              </td>
              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>● Online</span>
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid #1e293b' }}>
              <td style={{ padding: '14px 20px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                +91 80 4700 8002
              </td>
              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#34d399' }}>
                Jamin Bazaar
              </td>
              <td style={{ padding: '14px 16px' }}>Round-Robin (Available Land Agents)</td>
              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Active (Whisper AI)</span>
              </td>
              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>● Online</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Global Telephony Provider Card */}
      <div className="card" style={{ padding: 24, backgroundColor: '#0f172a', borderColor: '#334155', maxWidth: 640 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>
          Platform Carrier & SIP Settings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#94a3b8' }}>Telephony Gateway Carrier</label>
            <input
              type="text"
              className="form-input"
              style={{ backgroundColor: '#1e293b', color: '#ffffff', borderColor: '#475569' }}
              value={provider}
              onChange={e => setProvider(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#94a3b8' }}>Call Recording Retention Policy</label>
            <input
              type="text"
              className="form-input"
              style={{ backgroundColor: '#1e293b', color: '#ffffff', borderColor: '#475569' }}
              value={recordingRetention}
              onChange={e => setRecordingRetention(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
