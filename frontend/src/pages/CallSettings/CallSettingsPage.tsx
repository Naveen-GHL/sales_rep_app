import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  Phone,
  Volume2,
} from 'lucide-react';
import { storageService, PopupPosition } from '../../services/storageService';
import { useCall } from '../../context/CallContext';
import './CallSettingsPage.css';

export const CallSettingsPage: React.FC = () => {
  const [position, setPosition] = useState<PopupPosition>(() => storageService.getPopupPosition());
  const { simulateIncomingCall } = useCall();

  useEffect(() => {
    const handleUpdate = () => {
      setPosition(storageService.getPopupPosition());
    };
    window.addEventListener('nexus_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('nexus_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleSelectPosition = (newPos: PopupPosition) => {
    setPosition(newPos);
    storageService.setPopupPosition(newPos);
  };

  const options: {
    value: PopupPosition;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'top-right',
      label: 'Top Right',
      description: 'Popup appears at the top-right corner of the viewport (Standard default)',
      icon: <ArrowUpRight size={18} />,
    },
    {
      value: 'top-left',
      label: 'Top Left',
      description: 'Popup appears at the top-left corner of the viewport',
      icon: <ArrowUpLeft size={18} />,
    },
    {
      value: 'bottom-right',
      label: 'Bottom Right',
      description: 'Popup appears at the bottom-right corner of the viewport',
      icon: <ArrowDownRight size={18} />,
    },
    {
      value: 'bottom-left',
      label: 'Bottom Left',
      description: 'Popup appears at the bottom-left corner of the viewport',
      icon: <ArrowDownLeft size={18} />,
    },
  ];

  return (
    <div className="callsettings-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PhoneCall size={24} color="var(--primary-600)" /> Call Settings
          </h1>
          <p className="page-subtitle">
            Configure telephony preferences, caller alerts, and incoming call notification display positioning.
          </p>
        </div>
      </div>

      <div className="callsettings-content-wrapper">
        {/* Incoming Call Popup Settings Card */}
        <div className="card callsettings-card">
          <div className="callsettings-card-header">
            <div>
              <h3 className="callsettings-card-title">
                Incoming Call Popup
              </h3>
              <p className="callsettings-card-subtitle">
                Select the screen corner where incoming call notifications appear.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm callsettings-test-btn"
              onClick={() => simulateIncomingCall('Rahul Sharma (VIP Lead)', '+91 98765 43210')}
              title="Test the popup at the currently selected position"
            >
              <Volume2 size={14} color="var(--primary-600)" /> Simulate Incoming Call
            </button>
          </div>

          {/* Radio Options List */}
          <div className="callsettings-options-list">
            {options.map(opt => {
              const isSelected = position === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelectPosition(opt.value)}
                  className={`callsettings-option-item ${isSelected ? 'selected' : ''}`}
                >
                  <div className="callsettings-option-left">
                    <input
                      type="radio"
                      id={`pos-${opt.value}`}
                      name="popup-position"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => handleSelectPosition(opt.value)}
                      className="callsettings-radio-input"
                    />

                    <div>
                      <div className={`callsettings-option-label ${isSelected ? 'selected' : ''}`}>
                        {opt.label}
                        {opt.value === 'top-right' && (
                          <span className="callsettings-default-badge">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="callsettings-option-desc">
                        {opt.description}
                      </div>
                    </div>
                  </div>

                  <div className={`callsettings-option-icon-box ${isSelected ? 'selected' : ''}`}>
                    {opt.icon}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Viewport Preview Box */}
          <div className="callsettings-preview-box">
            <div className="callsettings-preview-header">
              <span className="callsettings-preview-title">
                Screen Viewport Preview
              </span>
              <span className="callsettings-preview-active-label">
                Active Position: {options.find(o => o.value === position)?.label}
              </span>
            </div>

            {/* Screen representation */}
            <div className="callsettings-preview-screen">
              {/* Mini mock topbar */}
              <div className="callsettings-preview-topbar">
                <div className="callsettings-preview-dot red" />
                <div className="callsettings-preview-dot amber" />
                <div className="callsettings-preview-dot green" />
              </div>

              {/* Mini mock sidebar */}
              <div className="callsettings-preview-sidebar" />

              {/* Mini incoming call popup representation */}
              <div
                className="callsettings-preview-popup-mock"
                style={{
                  top: position.startsWith('top') ? 22 : 'auto',
                  bottom: position.startsWith('bottom') ? 8 : 'auto',
                  left: position.endsWith('left') ? 40 : 'auto',
                  right: position.endsWith('right') ? 8 : 'auto',
                }}
              >
                <Phone size={10} /> Incoming Call
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
