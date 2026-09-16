import React, { useState, useEffect } from 'react';
import { FileText, FileImage, FileSpreadsheet, Trash2, File } from 'lucide-react';
import { DocumentItem } from '../../types';
import { storageService } from '../../services/storageService';
import { EmptyState } from './EmptyState';

// ── Types ────────────────────────────────────────────────────────────────────

interface DocumentListProps {
  entityType: DocumentItem['entityType'];
  entityId: string;
  /** If true, a delete button is rendered per row. Default: false. */
  canDelete?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFileIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith('image/')) {
    return <FileImage size={20} color="#0284c7" />;
  }
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv')
  ) {
    return <FileSpreadsheet size={20} color="#059669" />;
  }
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text')) {
    return <FileText size={20} color="var(--primary-600)" />;
  }
  return <File size={20} color="var(--text-secondary)" />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DocumentList: React.FC<DocumentListProps> = ({
  entityType,
  entityId,
  canDelete = false,
}) => {
  const [docs, setDocs] = useState<DocumentItem[]>([]);

  const loadDocs = () => {
    setDocs(storageService.getDocuments(entityType, entityId));
  };

  useEffect(() => {
    loadDocs();
    window.addEventListener('nexus_storage_updated', loadDocs);
    return () => window.removeEventListener('nexus_storage_updated', loadDocs);
  }, [entityType, entityId]);

  const handleDelete = (id: string) => {
    if (confirm('Remove this document record?')) {
      storageService.deleteDocument(id);
    }
  };

  if (docs.length === 0) {
    return (
      <EmptyState
        title="No documents logged"
        description="Upload a file above to start tracking documents for this record."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}
      >
        {docs.length} Document{docs.length !== 1 ? 's' : ''} Logged
      </div>

      {docs.map(doc => (
        <div
          key={doc.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-base)',
            backgroundColor: 'var(--bg-surface)',
            transition: 'background-color var(--transition-fast)',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')
          }
        >
          {/* Type icon */}
          <div style={{ flexShrink: 0 }}>{getFileIcon(doc.type)}</div>

          {/* File info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {doc.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 12px',
              }}
            >
              <span>{doc.size}</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-base)',
                  fontWeight: 600,
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                }}
              >
                {doc.category}
              </span>
              <span>by {doc.uploadedBy}</span>
              <span>{doc.uploadedAt}</span>
            </div>
          </div>

          {/* Delete */}
          {canDelete && (
            <button
              className="btn btn-ghost btn-sm btn-icon"
              title="Remove document record"
              onClick={() => handleDelete(doc.id)}
              style={{
                flexShrink: 0,
                color: 'var(--danger)',
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
