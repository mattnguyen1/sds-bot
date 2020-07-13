const execute = (message) => {
	message.channel.send('pong');
};

module.exports = {
	name: 'ping',
	execute,
};
