import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant, TenantSlug, RoleCode } from '../types';
import { USERS, TENANTS, ROLES } from '../services/mockData';
import { PERMISSIONS } from '../constants/permissions';
import { FEATURES } from '../constants/features';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  enabledFeatures: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, roleCode?: RoleCode, tenantSlug?: TenantSlug) => void;
  logout: () => void;
  switchPersona: (roleCode: RoleCode, tenantSlug?: TenantSlug) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to GHL Company Admin for immediate rich experience
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexus_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return USERS[1]; // Vikram Malhotra (GHL Admin)
  });

  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const saved = localStorage.getItem('nexus_current_tenant');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return TENANTS.ghl;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('nexus_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nexus_current_user');
    }
  }, [user]);

  useEffect(() => {
    if (tenant) {
      localStorage.setItem('nexus_current_tenant', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('nexus_current_tenant');
    }
  }, [tenant]);

  const isSuperAdmin = user?.role.code === 'super_admin';

  // Derive enabled features
  const enabledFeatures = isSuperAdmin
    ? Object.values(FEATURES)
    : tenant?.enabledFeatures || [];

  // Derive permissions
  const permissions = user?.role.permissions || [];

  const switchPersona = (roleCode: RoleCode, tenantSlug?: TenantSlug) => {
    if (roleCode === 'super_admin') {
      const superUser = USERS.find(u => u.role.code === 'super_admin') || USERS[0];
      setUser(superUser);
      setTenant(null);
      return;
    }

    const slug = tenantSlug || 'ghl';
    const targetTenant = TENANTS[slug];
    setTenant(targetTenant);

    const targetUser = USERS.find(
      u => u.companySlug === slug && u.role.code === roleCode
    ) || {
      id: `usr-${slug}-${roleCode}`,
      name: `${roleCode === 'company_admin' ? 'Admin' : 'Executive'} (${targetTenant.name})`,
      email: `${roleCode}@${slug}.com`,
      phone: '+91 98000 00000',
      role: ROLES[roleCode],
      companyId: targetTenant.id,
      companySlug: slug,
      companyName: targetTenant.name,
      status: 'Active',
      lastLogin: 'Just now',
    };

    setUser(targetUser);
  };

  const login = (_email: string, roleCode: RoleCode = 'company_admin', tenantSlug: TenantSlug = 'ghl') => {
    switchPersona(roleCode, tenantSlug);
  };

  const logout = () => {
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        enabledFeatures,
        permissions,
        isAuthenticated: !!user,
        isSuperAdmin,
        login,
        logout,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
