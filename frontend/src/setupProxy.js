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

  // FastAPI 경로만 명시적으로 지정 (prefix 매칭 때문에 /api/chat/rooms가 FastAPI로 가지 않게)
  app.use(['/api/chat/gemini', '/api/chat/completions'], fastapi);
  app.use('/api/analysis', fastapi);
  app.use('/api/health', fastapi);
  app.use('/api/preparing', fastapi);

  app.use('/api', spring);
  app.use('/oauth2', spring);
};
