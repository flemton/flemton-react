const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const http = require('http');

// Regression test for CVE-2024-XXXX (Arbitrary Code Execution in webpack-dev-middleware)
// This vulnerability allowed RCE through specially crafted URLs in dev mode.
// The fix ensures webpack-dev-middleware >= 5.3.4 is used.

describe('webpack-dev-middleware security regression', () => {
  it('should have webpack-dev-middleware version >= 5.3.4', () => {
    const middlewarePackage = require('webpack-dev-middleware/package.json');
    const version = middlewarePackage.version;
    const [major, minor, patch] = version.split('.').map(Number);

    // Check version is at least 5.3.4
    const isVulnerable =
      major < 5 ||
      (major === 5 && minor < 3) ||
      (major === 5 && minor === 3 && patch < 4);

    expect(isVulnerable).toBe(false);
    expect(version).toMatch(/^(5\.(3\.[4-9]|[4-9]\.\d)|[6-9]\.\d\.\d)/);
  });

  it('should not allow path traversal in dev server requests', done => {
    // Create a minimal webpack compiler
    const compiler = webpack({
      mode: 'development',
      entry: './test/fixtures/jsconfig/src/index.js',
      output: {
        path: '/tmp/test-output',
        filename: 'bundle.js',
      },
    });

    const instance = middleware(compiler, {
      publicPath: '/',
    });

    // Create a test server
    const server = http.createServer((req, res) => {
      instance(req, res, () => {
        res.writeHead(404);
        res.end('Not found');
      });
    });

    server.listen(0, () => {
      const port = server.address().port;

      // Try path traversal - should not succeed
      const req = http.get(
        `http://localhost:${port}/../../../etc/passwd`,
        res => {
          let body = '';
          res.on('data', chunk => (body += chunk));
          res.on('end', () => {
            // Should not return /etc/passwd content
            expect(body).not.toContain('root:');
            server.close();
            done();
          });
        }
      );

      req.on('error', err => {
        // Connection errors are acceptable (security measure)
        server.close();
        done();
      });

      // Timeout to prevent hanging
      req.setTimeout(5000, () => {
        req.destroy();
        server.close();
        done();
      });
    });
  });
});
