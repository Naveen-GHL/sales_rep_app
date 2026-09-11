export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleCode: string;
  permissions: string[];
  companyId?: string | null;
  companySlug?: string | null;
  companyName?: string | null;
  status: string;
  avatar?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      companyId?: string;
      companySlug?: string;
    }
  }
}
