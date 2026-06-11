import { Role } from '@prisma/client';

export type TierFeatures = {
  hasInbox: boolean;
  hasCompose: boolean;
  hasCalendarView: boolean;
  hasBasicSearch: boolean;
  maxEmailsIndexed: number | 'UNLIMITED';
  hasAgent: boolean;
  hasIntegrations: boolean;
  hasMorningDigest: boolean;
  hasVectorSearch: boolean;
  hasVoice: boolean;
  hasSeatManagement: boolean;
  hasAuditLog: boolean;
  hasSharedAgentCommands: boolean;
  hasUserImpersonation: boolean;
  hasBillingOverride: boolean;
  hasAllDataAccess: boolean;
  isScopedToOwnAccount: boolean;
};

export const ROLE_FEATURES: Record<Role, TierFeatures> = {
  FREE: {
    hasInbox: true,
    hasCompose: true,
    hasCalendarView: true,
    hasBasicSearch: true,
    maxEmailsIndexed: 500,
    hasAgent: false,
    hasIntegrations: false,
    hasMorningDigest: false,
    hasVectorSearch: false,
    hasVoice: false,
    hasSeatManagement: false,
    hasAuditLog: false,
    hasSharedAgentCommands: false,
    hasUserImpersonation: false,
    hasBillingOverride: false,
    hasAllDataAccess: false,
    isScopedToOwnAccount: true,
  },
  PRO: {
    hasInbox: true,
    hasCompose: true,
    hasCalendarView: true,
    hasBasicSearch: true,
    maxEmailsIndexed: 'UNLIMITED',
    hasAgent: true,
    hasIntegrations: true,
    hasMorningDigest: true,
    hasVectorSearch: true,
    hasVoice: true,
    hasSeatManagement: false,
    hasAuditLog: false,
    hasSharedAgentCommands: false,
    hasUserImpersonation: false,
    hasBillingOverride: false,
    hasAllDataAccess: false,
    isScopedToOwnAccount: true,
  },
  TEAM_MEMBER: {
    hasInbox: true,
    hasCompose: true,
    hasCalendarView: true,
    hasBasicSearch: true,
    maxEmailsIndexed: 'UNLIMITED',
    hasAgent: true,
    hasIntegrations: true,
    hasMorningDigest: true,
    hasVectorSearch: true,
    hasVoice: true,
    hasSeatManagement: false,
    hasAuditLog: false,
    hasSharedAgentCommands: false,
    hasUserImpersonation: false,
    hasBillingOverride: false,
    hasAllDataAccess: false,
    isScopedToOwnAccount: true,
  },
  TEAM_ADMIN: {
    hasInbox: true,
    hasCompose: true,
    hasCalendarView: true,
    hasBasicSearch: true,
    maxEmailsIndexed: 'UNLIMITED',
    hasAgent: true,
    hasIntegrations: true,
    hasMorningDigest: true,
    hasVectorSearch: true,
    hasVoice: true,
    hasSeatManagement: true,
    hasAuditLog: true,
    hasSharedAgentCommands: true,
    hasUserImpersonation: false,
    hasBillingOverride: false,
    hasAllDataAccess: false,
    isScopedToOwnAccount: true, // But can manage team
  },
  SUPER_ADMIN: {
    hasInbox: true,
    hasCompose: true,
    hasCalendarView: true,
    hasBasicSearch: true,
    maxEmailsIndexed: 'UNLIMITED',
    hasAgent: true,
    hasIntegrations: true,
    hasMorningDigest: true,
    hasVectorSearch: true,
    hasVoice: true,
    hasSeatManagement: true,
    hasAuditLog: true,
    hasSharedAgentCommands: true,
    hasUserImpersonation: true,
    hasBillingOverride: true,
    hasAllDataAccess: true,
    isScopedToOwnAccount: false,
  },
};
