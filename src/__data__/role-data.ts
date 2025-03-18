import { RoleKind } from '../hooks/useRole';

export const defaultKonfluxRoleMap = {
  roleMap: {
    'konflux-admin-user-actions': 'Admin',
    'konflux-contributor-user-actions': 'Contributor',
    'konflux-maintainer-user-actions': 'Maintainer',
  },
  roleKind: 'ClusterRole' as RoleKind,
  roleDescription: {
    'konflux-admin-user-actions': 'Full access to Konflux resources including secrets',
    'konflux-contributor-user-actions':
      'View access to Konflux resources without access to secrets',
    'konflux-maintainer-user-actions':
      'Partial access to Konflux resources without access to secrets',
  },
};

export const mockConfigMap = {
  kind: 'ConfigMap',
  apiVersion: 'v1',
  metadata: {
    name: 'konflux-public-info',
    namespace: 'konflux-info',
  },
  data: {
    'info.json':
      '{\n    "environment": "staging",\n    "integrations": {\n        "github": {\n            "application_url": "https://github.com/apps/konflux-staging"\n        },\n        "sbom_server": {\n            "url": "https://atlas.stage.devshift.net/sbom/content/\u003cPLACEHOLDER\u003e"\n        },\n        "image_controller": {\n            "enabled": true,\n            "notifications": [\n                {\n                    "title": "SBOM-event-to-Bombino",\n                    "event": "repo_push",\n                    "method": "webhook",\n                    "config": {\n                        "url": "https://bombino.preprod.api.redhat.com/v1/sbom/quay/push"\n                    }\n                }\n            ]\n        }\n    },\n    "rbac": [\n        {\n            "displayName": "admin",\n            "description": "Full access to Konflux resources including secrets",\n            "roleRef": {\n                "apiGroup": "rbac.authorization.k8s.io",\n                "kind": "ClusterRole",\n                "name": "konflux-admin-user-actions"\n            }\n        },\n        {\n            "displayName": "maintainer",\n            "description": "Partial access to Konflux resources without access to secrets",\n            "roleRef": {\n                "apiGroup": "rbac.authorization.k8s.io",\n                "kind": "ClusterRole",\n                "name": "konflux-maintainer-user-actions"\n            }\n        },\n        {\n            "displayName": "contributor",\n            "description": "View access to Konflux resources without access to secrets",\n            "roleRef": {\n                "apiGroup": "rbac.authorization.k8s.io",\n                "kind": "ClusterRole",\n                "name": "konflux-contributor-user-actions"\n            }\n        }\n    ]\n}\n',
  },
};

export const invalidMockConfigMap = {
  kind: 'ConfigMap',
  apiVersion: 'v1',
  metadata: {
    name: 'konflux-public-info',
    namespace: 'konflux-info',
  },
};

export const MockInfo = {
  rbac: [
    {
      displayName: 'admin',
      description: 'Full access to Konflux resources including secrets',
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'konflux-admin-user-actions',
      },
    },
    {
      displayName: 'maintainer',
      description: 'Partial access to Konflux resources without access to secrets',
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'konflux-maintainer-user-actions',
      },
    },
    {
      displayName: 'contributor',
      description: 'View access to Konflux resources without access to secrets',
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'konflux-contributor-user-actions',
      },
    },
  ],
};
