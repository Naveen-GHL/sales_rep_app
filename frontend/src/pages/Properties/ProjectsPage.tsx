import React, { useState, useEffect } from 'react';
import { MapPin, Grid, Plus, CheckCircle, Clock } from 'lucide-react';
import { PropertyProject } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { StatusChip } from '../../components/common/StatusChip';

interface ProjectsPageProps {
  onNavigate: (route: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  const { tenant } = useAuth();
  const [projects, setProjects] = useState<PropertyProject[]>([]);

  useEffect(() => {
    setProjects(storageService.getProjects());
    const handleUpdate = () => setProjects(storageService.getProjects());
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MapPin size={24} color="#059669" /> Plotted Projects & Communities
          </h1>
          <p className="page-subtitle">
            Master developments, land sanctions, and project-level inventory for {tenant?.name}.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {projects.map(proj => (
          <div key={proj.id} className="card card-hover" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{proj.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  📍 {proj.location}
                </div>
              </div>
              <StatusChip status={proj.status} size="sm" />
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {proj.description}
            </p>

            <div style={{ backgroundColor: 'var(--bg-surface-hover)', padding: '12px 14px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Available</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#059669' }}>{proj.availablePlots}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>On Hold</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#d97706' }}>{proj.holdPlots}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sold</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#dc2626' }}>{proj.soldPlots}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-base)', paddingTop: 12, marginTop: 'auto' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {proj.priceRange}
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('plots')}
              >
                <Grid size={13} /> View Layout Grid
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
