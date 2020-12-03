const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
	app.use(
		createProxyMiddleware(
			'/chatbot', {
				target: 'http://localhost:6001/',
				pathRewrite: {
					'^/chatbot': '/chatbot'
				}
			}
		)
	)
}
