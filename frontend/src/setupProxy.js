/**
 * CRA 개발 서버 프록시.
 * - Spring Boot (8080) 과 FastAPI (8000) 가 모두 /api 를 쓰므로 package.json 의 단일 proxy 로는 한쪽만 됩니다.
 * - 더 구체적인 경로를 먼저 등록해야 합니다.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const fastapi = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    logLevel: 'warn',
  });
  const spring = createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
    logLevel: 'warn',
  });

  app.use('/api/chat', fastapi);
  app.use('/api/analysis', fastapi);
  app.use('/api/health', fastapi);

  app.use('/api', spring);
  app.use('/oauth2', spring);
};
