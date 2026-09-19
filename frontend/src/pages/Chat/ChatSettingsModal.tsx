import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import {
  Bell,
  Shield,
  PhoneCall,
  Sliders,
  Users,
  Pin,
  Volume2,
  Trash2,
  Edit2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { ChatConversation, ChatMember, ChatSettings } from '../../types';
import * as cs from '../../services/chatStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  me: ChatMember;
  companyId: string;
  activeConversation: ChatConversation | null;
  onConversationUpdated?: () => void;
  onNavigate?: (route: string) => void;
}

const DEFAULT_SETTINGS: ChatSettings = {
  notifications: {
    desktopPush: true,
    sound: true,
    mentionOnly: false,
  },
  privacy: {
    readReceipts: true,
    typingIndicator: true,
    whoCanDm: 'everyone',
  },
  calls: {
    defaultMic: 'default',
    defaultCamera: 'default',
    cameraOffOnJoin: false,
    autoAnswer: false,
  },
  adminGovernance: {
    retentionDays: 0,
    fileRetentionDays: 0,
    whoCanCreateGroups: 'everyone',
  },
};

export const ChatSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  me,
  companyId,
  activeConversation,
  onConversationUpdated,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'conversation' | 'calls' | 'admin'>('notifications');
  const [settings, setSettings] = useState<ChatSettings>(() => {
    return cs.getChatSettings(companyId, me.id) || DEFAULT_SETTINGS;
  });

  const [renameValue, setRenameValue] = useState(activeConversation?.name || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setRenameValue(activeConversation?.name || '');
  }, [activeConversation]);

  const isAdmin = me.roleCode === 'company_admin' || me.roleCode === 'super_admin';
  const isManagerOrAdmin = isAdmin || me.roleCode === 'sales_manager';

  const handleToggle = (category: keyof ChatSettings, key: string) => {
    setSettings(prev => {
      const cat = { ...(prev[category] as any) };
      cat[key] = !cat[key];
      const updated = { ...prev, [category]: cat };
      cs.saveChatSettings(companyId, me.id, updated);
      return updated;
    });
  };

  const handleSelectChange = (category: keyof ChatSettings, key: string, value: any) => {
    setSettings(prev => {
      const cat = { ...(prev[category] as any) };
      cat[key] = value;
      const updated = { ...prev, [category]: cat };
      cs.saveChatSettings(companyId, me.id, updated);
      return updated;
    });
  };

  // Per-conversation actions
  const handleTogglePin = () => {
    if (!activeConversation) return;
    cs.togglePinConversation(activeConversation.id);
    onConversationUpdated?.();
  };

  const handleToggleMute = () => {
    if (!activeConversation) return;
    cs.toggleMuteConversation(activeConversation.id);
    onConversationUpdated?.();
  };

  const handleRenameGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !renameValue.trim() || activeConversation.type !== 'group') return;
    cs.renameConversation(activeConversation.id, renameValue.trim());
    onConversationUpdated?.();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearHistory = () => {
    if (!activeConversation) return;
    if (confirm('Are you sure you want to clear chat history for this conversation?')) {
      cs.clearConversationMessages(activeConversation.id);
      onConversationUpdated?.();
      alert('Conversation history cleared.');
    }
  };

  const handleLeaveGroup = () => {
    if (!activeConversation || activeConversation.type !== 'group') return;
    if (confirm('Are you sure you want to leave this group chat?')) {
      cs.leaveConversation(activeConversation.id, me.id);
      onConversationUpdated?.();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chat & Meetings Settings"
      subtitle="Customize your notification preferences, privacy, device defaults, and channel management."
      maxWidth={800}
    >
      <div className="chat-settings-layout">
        {/* Navigation Tabs */}
        <div className="chat-settings-nav">
          <button
            type="button"
            className={`chat-settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} />
            <span>Notifications</span>
          </button>
          <button
            type="button"
            className={`chat-settings-nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield size={16} />
            <span>Privacy</span>
          </button>
          <button
            type="button"
            className={`chat-settings-nav-item ${activeTab === 'conversation' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversation')}
          >
            <Sliders size={16} />
            <span>Active Conversation</span>
          </button>
          <button
            type="button"
            className={`chat-settings-nav-item ${activeTab === 'calls' ? 'active' : ''}`}
            onClick={() => setActiveTab('calls')}
          >
            <PhoneCall size={16} />
            <span>Calls & Devices</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`chat-settings-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Users size={16} />
              <span>Admin Governance</span>
            </button>
          )}
        </div>

        {/* Tab Panels */}
        <div className="chat-settings-panel">
          {/* 1. Notifications */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h4 className="settings-section-title">Notification Preferences</h4>
              
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">Desktop & Push Notifications</div>
                  <div className="settings-toggle-desc">Show banner alerts when you receive new chat messages.</div>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={settings.notifications.desktopPush}
                  onChange={() => handleToggle('notifications', 'desktopPush')}
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">Notification Sound</div>
                  <div className="settings-toggle-desc">Play an audible chime when new incoming messages arrive.</div>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={settings.notifications.sound}
                  onChange={() => handleToggle('notifications', 'sound')}
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">@Mentions Only Mode</div>
                  <div className="settings-toggle-desc">Only alert me when someone explicitly tags @me or calls me directly.</div>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={settings.notifications.mentionOnly}
                  onChange={() => handleToggle('notifications', 'mentionOnly')}
                />
              </div>
            </div>
          )}

          {/* 2. Privacy */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h4 className="settings-section-title">Privacy & Presence Indicators</h4>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">Read Receipts</div>
                  <div className="settings-toggle-desc">Let others know when you have viewed their sent messages.</div>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={settings.privacy.readReceipts}
                  onChange={() => handleToggle('privacy', 'readReceipts')}
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">Typing Indicator</div>
                  <div className="settings-toggle-desc">Display animated "typing…" status while composing messages.</div>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={settings.privacy.typingIndicator}
                  onChange={() => handleToggle('privacy', 'typingIndicator')}
                />
              </div>

              <div className="settings-select-group">
                <label className="settings-label">Who Can Direct Message (DM) Me?</label>
                <select
                  className="form-input"
                  value={settings.privacy.whoCanDm}
                  onChange={e => handleSelectChange('privacy', 'whoCanDm', e.target.value)}
                >
                  <option value="everyone">Everyone in my organization</option>
                  <option value="team">My sales department / team only</option>
                  <option value="managers_admins">Managers & Administrators only</option>
                </select>
              </div>
            </div>
          )}

          {/* 3. Active Conversation */}
          {activeTab === 'conversation' && (
            <div className="settings-section">
              <h4 className="settings-section-title">
                Conversation: {activeConversation ? (activeConversation.name || (activeConversation.type === 'dm' ? 'Direct Message' : 'Group Chat')) : 'None Selected'}
              </h4>

              {!activeConversation ? (
                <p className="settings-empty-notice">Select an active conversation from the sidebar to configure its settings.</p>
              ) : (
                <>
                  {activeConversation.type === 'group' && isManagerOrAdmin && (
                    <form onSubmit={handleRenameGroup} className="settings-form-row">
                      <label className="settings-label">Rename Group Chat</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          className="form-input"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          placeholder="Group name"
                        />
                        <button type="submit" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {saveSuccess ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Edit2 size={14} />} Save
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="settings-actions-grid">
                    <button
                      type="button"
                      className={`btn btn-secondary btn-sm ${activeConversation.isPinned ? 'active' : ''}`}
                      onClick={handleTogglePin}
                    >
                      <Pin size={14} />
                      <span>{activeConversation.isPinned ? 'Unpin Conversation' : 'Pin to Top'}</span>
                    </button>

                    <button
                      type="button"
                      className={`btn btn-secondary btn-sm ${activeConversation.isMuted ? 'active' : ''}`}
                      onClick={handleToggleMute}
                    >
                      <Volume2 size={14} />
                      <span>{activeConversation.isMuted ? 'Unmute Notifications' : 'Mute Conversation'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--warning)' }}
                      onClick={handleClearHistory}
                    >
                      <Trash2 size={14} />
                      <span>Clear Chat History</span>
                    </button>

                    {activeConversation.type === 'group' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger-500)' }}
                        onClick={handleLeaveGroup}
                      >
                        <Trash2 size={14} />
                        <span>Leave Group</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. Calls & Devices */}
          {activeTab === 'calls' && (
            <div className="settings-section">
              <h4 className="settings-section-title">WebRTC Calling & Media Devices</h4>

              <div className="settings-select-group">
                <label className="settings-label">Default Audio Input (Microphone)</label>
                <select
                  className="form-input"
                  value={settings.calls.defaultMic}
                  onChange={e => handleSelectChange('calls', 'defaultMic', e.target.value)}
                >
                  <option value="default">Default System Microphone</option>
                  <option value="headset">Communications Headset</option>
                  <option value="internal">Built-in Microphone Array</option>
                </select>
              </div>

              <div className="settings-select-group">
                <label className="settings-label">Default Video Input (Camera)</label>
                <select
                  className="form-input"
                  value={settings.calls.defaultCamera}
                  onChange={e => handleSelectChange('calls', 'defaultCamera', e.target.value)}
                >
                  <option value="default">Default Web Camera</option>
                  <option value="hd">Integrated HD Webcam (1080p)</option>
                </select>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">Turn Camera Off When Joining</div>
                  <div className="settings-toggle-desc">Join video meetings with camera muted by default.</div>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={settings.calls.cameraOffOnJoin}
                  onChange={() => handleToggle('calls', 'cameraOffOnJoin')}
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">Auto-Answer Incoming Calls</div>
                  <div className="settings-toggle-desc">Automatically accept direct calls from authorized teammates.</div>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle-input"
                  checked={settings.calls.autoAnswer}
                  onChange={() => handleToggle('calls', 'autoAnswer')}
                />
              </div>
            </div>
          )}

          {/* 5. Admin Governance */}
          {activeTab === 'admin' && isAdmin && (
            <div className="settings-section">
              <h4 className="settings-section-title">Admin Governance & Multi-Tenant Policies</h4>

              <div className="settings-info-card">
                <div>
                  <strong>Company Users & Department Directory</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Manage user roles, departmental assignments, and permissions directly in the company user management portal.
                  </p>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { onClose(); onNavigate('company-users'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Manage Directory</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>

              <div className="settings-select-group" style={{ marginTop: 16 }}>
                <label className="settings-label">Message Retention Policy</label>
                <select
                  className="form-input"
                  value={settings.adminGovernance?.retentionDays ?? 0}
                  onChange={e => handleSelectChange('adminGovernance', 'retentionDays', Number(e.target.value))}
                >
                  <option value={0}>Retain Forever (No automated expiration)</option>
                  <option value={30}>Auto-delete after 30 Days</option>
                  <option value={90}>Auto-delete after 90 Days</option>
                  <option value={365}>Auto-delete after 1 Year</option>
                </select>
              </div>

              <div className="settings-select-group">
                <label className="settings-label">File Share Retention Policy</label>
                <select
                  className="form-input"
                  value={settings.adminGovernance?.fileRetentionDays ?? 0}
                  onChange={e => handleSelectChange('adminGovernance', 'fileRetentionDays', Number(e.target.value))}
                >
                  <option value={0}>Retain Uploads Forever</option>
                  <option value={60}>Purge file data after 60 Days</option>
                  <option value={180}>Purge file data after 180 Days</option>
                </select>
              </div>

              <div className="settings-select-group">
                <label className="settings-label">Group Chat Creation Permissions</label>
                <select
                  className="form-input"
                  value={settings.adminGovernance?.whoCanCreateGroups ?? 'everyone'}
                  onChange={e => handleSelectChange('adminGovernance', 'whoCanCreateGroups', e.target.value)}
                >
                  <option value="everyone">All Employees & Agents</option>
                  <option value="managers_admins">Managers and Company Admins Only</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chat-settings-footer">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
};
