import selfsigned from 'selfsigned';

// Each test process creates its own TLS material; no private key is stored in Git.
export const { cert, private: key } = await selfsigned.generate(
  [{ name: 'commonName', value: 'localhost' }],
  {
    algorithm: 'sha256',
    keySize: 2048,
    notBeforeDate: new Date(Date.now() - 60_000),
    notAfterDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    extensions: [
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
      { name: 'extKeyUsage', serverAuth: true },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
        ],
      },
    ],
  },
);
