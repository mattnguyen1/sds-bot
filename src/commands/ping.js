const execute = (message) => {
	message.channel.send('pong');
};

module.exports = {
    name: 'ping',
    description: 'Healthcheck command',
	execute,
};
