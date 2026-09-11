import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant, TenantSlug, RoleCode } from '../types';
import { DEFAULT_TENANTS } from '../constants/defaultTenants';
import { SYSTEM_ROLES } from '../constants/roles';
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
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexus_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    // Default to active session if previously saved, else null (shows Login)
    return null;
  });

  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const saved = localStorage.getItem('nexus_current_tenant');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_TENANTS.ghl;
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

  // Derive enabled features from live tenant object
  const enabledFeatures = isSuperAdmin
    ? Object.values(FEATURES)
    : tenant?.enabledFeatures || [];

  // Derive permissions from live user role
  const permissions = user?.role.permissions || [];

  const switchPersona = (roleCode: RoleCode, tenantSlug?: TenantSlug) => {
    if (roleCode === 'super_admin') {
      const superUser: User = {
        id: 'usr-super-01',
        name: 'Alex Rivera (Super Admin)',
        email: 'alex@nexusplatform.io',
        phone: '+91 98800 11000',
        role: SYSTEM_ROLES.super_admin,
        status: 'Active',
        lastLogin: 'Just now',
      };
      setUser(superUser);
      setTenant(null);
      return;
    }

    const slug = tenantSlug || 'ghl';
    const targetTenant = DEFAULT_TENANTS[slug];
    setTenant(targetTenant);

    const targetUser: User = {
      id: `usr-${slug}-${roleCode}`,
      name: roleCode === 'company_admin'
        ? (slug === 'ghl' ? 'Vikram Malhotra' : 'Kavita Rao')
        : (slug === 'ghl' ? 'Ananya Iyer' : 'Pooja Hegde'),
      email: `${roleCode}@${slug}.com`,
      phone: '+91 98450 00000',
      role: SYSTEM_ROLES[roleCode],
      companyId: targetTenant.id,
      companySlug: slug,
      companyName: targetTenant.name,
      status: 'Active',
      lastLogin: 'Just now',
    };

    setUser(targetUser);
  };

  const login = (email: string, roleCode: RoleCode = 'company_admin', tenantSlug: TenantSlug = 'ghl') => {
    // If logging in via real credentials / token
    const targetTenant = DEFAULT_TENANTS[tenantSlug];
    setTenant(targetTenant);

    const authenticatedUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' '),
      email,
      phone: '+91 98000 00000',
      role: SYSTEM_ROLES[roleCode] || SYSTEM_ROLES.company_admin,
      companyId: targetTenant.id,
      companySlug: tenantSlug,
      companyName: targetTenant.name,
      status: 'Active',
      lastLogin: 'Just now',
    };

    setUser(authenticatedUser);
  };

  const logout = () => {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_current_user');
    localStorage.removeItem('nexus_current_tenant');
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
        setUser,
        setTenant,
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
