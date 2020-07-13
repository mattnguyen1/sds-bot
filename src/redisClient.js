const url = require('url');
const redis = require('redis');

const redisURL = url.parse(process.env.REDIS_URL);
const redisClient = redis.createClient(redisURL.port, redisURL.hostname);

// Authenticate with the Redis instance
redisClient.auth(redisURL.auth.split(':')[1], (err) => {
	if (err) {
		console.log(`Redis auth error: ${err}`);
	}
});

// Subscribe to Redis errors
redisClient.on('error', (err) => {
	console.log(`Redis Error ${err}`);
});

module.exports = redisClient;
