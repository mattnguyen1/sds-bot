const { removeRoleFromUser } = require('../utils');

const donationCache = {};

const execute = (message, args) => {
    const { member, guild, channel } = message;
    const role = donationCache[guild.id];
    if (!role) {
        channel.send('There seems to be no donation reminder set up.');
        return;
    }
    removeRoleFromUser(member, role)
        .then(() => message.react('✅'));
};

const set = (k, v) => {
    donationCache[k] = v;
}

module.exports = {
    name: 'donate',
    description: 'Removes the donation role the user who sent the command if the server has a donation reminder setup',
	execute,
    set,
};
