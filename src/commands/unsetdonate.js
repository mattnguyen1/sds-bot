const redisClient = require('../redisClient');

const execute = (message, args) => {
    const { guild, } = message;
    
    redisClient.hdel('donations', guild.id, () => {
        message.react('✅')
    });
};

module.exports = {
    name: 'unsetdonate',
    description: 'Removes donation reminder from server',
	execute,
};
