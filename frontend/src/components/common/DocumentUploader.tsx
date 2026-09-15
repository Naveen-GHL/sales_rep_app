import React, { useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentItem } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface DocumentUploaderProps {
  entityType: DocumentItem['entityType'];
  entityId: string;
  /** Optional category labels the user can pick from. Defaults to ['KYC', 'Agreement', 'Other']. */
  allowedCategories?: string[];
  /** Called after the document metadata has been saved to localStorage. */
  onUploaded?: (doc: DocumentItem) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  entityType,
  entityId,
  allowedCategories = ['KYC', 'Agreement', 'Payment Receipt', 'Other'],
  onUploaded,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(allowedCategories[0]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFile = (file: File) => {
    try {
      const doc: DocumentItem = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        uploadedBy: user?.name || 'Unknown User',
        uploadedAt: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        category: selectedCategory,
        entityType,
        entityId,
      };

      storageService.saveDocument(doc);
      onUploaded?.(doc);
      showToast('success', `"${file.name}" logged successfully.`);
    } catch {
      showToast('error', 'Failed to log document. Please try again.');
    }

    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Category selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          Category:
        </label>
        <select
          className="form-select"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{
            height: 30,
            fontSize: 12,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 10,
            paddingRight: 24,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-base)',
          }}
        >
          {allowedCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary-500)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '24px 16px',
          textAlign: 'center',
          backgroundColor: isDragging ? 'var(--primary-50)' : 'var(--bg-surface-hover)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Upload
          size={28}
          color={isDragging ? 'var(--primary-500)' : 'var(--primary-600)'}
          style={{ margin: '0 auto 10px' }}
        />
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
          {isDragging ? 'Drop file here' : 'Choose File or Drag & Drop'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          PDF, JPG, PNG, DOCX up to 25 MB
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 10, pointerEvents: 'none' }}
        >
          Browse Files
        </button>
      </div>

      {/* Metadata-only disclaimer */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        ℹ️ <em>This logs document metadata (name, size, date) — file contents are not uploaded to a server yet. The log persists in your browser and will be ready to link to real storage once a backend is connected.</em>
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        accept="*/*"
      />

      {/* Inline toast */}
      {toast && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            fontSize: 12,
            color: toast.type === 'success' ? '#047857' : '#b91c1c',
            fontWeight: 500,
            animation: 'slideDown 0.2s ease',
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={15} />
            : <AlertCircle size={15} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};
