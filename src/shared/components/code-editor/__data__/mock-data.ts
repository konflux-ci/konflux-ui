import { OpenAPISchemaDefinitions } from '../types';

export const mockedSwaggerDefinitions: OpenAPISchemaDefinitions = {
  'com.coreos.dex.v1.AuthCode': {
    type: 'object',
    'x-kubernetes-group-version-kind': [
      {
        group: 'dex.coreos.com',
        kind: 'AuthCode',
        version: 'v1',
      },
    ],
  },
  'com.coreos.dex.v1.AuthCodeList': {
    description: 'AuthCodeList is a list of AuthCode',
    type: 'object',
    required: ['items'],
    properties: {
      apiVersion: {
        description: 'APIVersion defines the versioned schema of this representation of an object.',
        type: 'string',
        example: 'dex.coreos.com/v1',
      },
      items: {
        description: 'List of authcodes.',
        type: 'array',
        items: {
          $ref: '#/definitions/com.coreos.dex.v1.AuthCode',
        },
        example: [
          {
            apiVersion: 'dex.coreos.com/v1',
            kind: 'AuthCode',
            metadata: {
              name: 'mock-authcode',
            },
          },
        ],
      },
      kind: {
        description: 'Kind is a string value representing the REST resource.',
        type: 'string',
        example: 'AuthCodeList',
      },
      metadata: {
        description: 'Standard list metadata.',
        $ref: '#/definitions/io.k8s.apimachinery.pkg.apis.meta.v1.ListMeta',
        example: {
          resourceVersion: '123',
          selfLink: '/apis/dex.coreos.com/v1/authcodes',
        },
      },
    },
    'x-kubernetes-group-version-kind': [
      {
        group: 'dex.coreos.com',
        kind: 'AuthCodeList',
        version: 'v1',
      },
    ],
  },
  'com.coreos.dex.v1.AuthRequest': {
    type: 'object',
    'x-kubernetes-group-version-kind': [
      {
        group: 'dex.coreos.com',
        kind: 'AuthRequest',
        version: 'v1',
      },
    ],
  },
  'com.coreos.dex.v1.AuthRequestList': {
    description: 'AuthRequestList is a list of AuthRequest',
    type: 'object',
    required: ['items'],
    properties: {
      apiVersion: {
        description: 'APIVersion defines the versioned schema.',
        type: 'string',
        example: 'dex.coreos.com/v1',
      },
      items: {
        description: 'List of authrequests.',
        type: 'array',
        items: {
          $ref: '#/definitions/com.coreos.dex.v1.AuthRequest',
        },
        example: [
          {
            apiVersion: 'dex.coreos.com/v1',
            kind: 'AuthRequest',
            metadata: {
              name: 'mock-authrequest',
            },
          },
        ],
      },
      kind: {
        description: 'Kind is a string value.',
        type: 'string',
        example: 'AuthRequestList',
      },
      metadata: {
        description: 'Standard list metadata.',
        $ref: '#/definitions/io.k8s.apimachinery.pkg.apis.meta.v1.ListMeta',
        example: {
          resourceVersion: '456',
          selfLink: '/apis/dex.coreos.com/v1/authrequests',
        },
      },
    },
    'x-kubernetes-group-version-kind': [
      {
        group: 'dex.coreos.com',
        kind: 'AuthRequestList',
        version: 'v1',
      },
    ],
  },
  'com.coreos.dex.v1.Connector': {
    type: 'object',
    'x-kubernetes-group-version-kind': [
      {
        group: 'dex.coreos.com',
        kind: 'Connector',
        version: 'v1',
      },
    ],
  },
  'com.coreos.dex.v1.ConnectorList': {
    description: 'ConnectorList is a list of Connector',
    type: 'object',
    required: ['items'],
    properties: {
      apiVersion: {
        description: 'APIVersion defines the versioned schema.',
        type: 'string',
        example: 'dex.coreos.com/v1',
      },
      items: {
        description: 'List of connectors.',
        type: 'array',
        items: {
          $ref: '#/definitions/com.coreos.dex.v1.Connector',
        },
        example: [
          {
            apiVersion: 'dex.coreos.com/v1',
            kind: 'Connector',
            metadata: {
              name: 'mock-connector',
            },
          },
        ],
      },
      kind: {
        description: 'Kind is a string value.',
        type: 'string',
        example: 'ConnectorList',
      },
      metadata: {
        description: 'Standard list metadata.',
        $ref: '#/definitions/io.k8s.apimachinery.pkg.apis.meta.v1.ListMeta',
        example: {
          resourceVersion: '789',
          selfLink: '/apis/dex.coreos.com/v1/connectors',
        },
      },
    },
    'x-kubernetes-group-version-kind': [
      {
        group: 'dex.coreos.com',
        kind: 'ConnectorList',
        version: 'v1',
      },
    ],
  },
  'com.coreos.dex.v1.DeviceRequest': {
    type: 'object',
    'x-kubernetes-group-version-kind': [
      {
        group: 'dex.coreos.com',
        kind: 'DeviceRequest',
        version: 'v1',
      },
    ],
  },
};
