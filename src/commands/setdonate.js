const chrono = require('chrono-node');
const redisClient = require('../redisClient');
const {
	getRoleId, getChannelId, getAllUsersWithRole, assignRoleToUser, setIntervalAfterTime, assignRoleToUsers,
} = require('../utils');
const { set } = require('./donate');

const TIME_IN_DAY_MS = 24 * 60 * 60 * 1000;
const reminderCache = {};

/**
 * @param {Message} message
 * @param {Object[]} args - setdonate <channel> <src-role> <new-role> <semantic time>
 */
const execute = (message, args) => {
	const [channelStr, srcRoleStr, newRoleStr, ...semanticTimeArr] = args;
	const channelPromise = message.client.channels.fetch(getChannelId(channelStr));
	const srcRolePromise = message.guild.roles.fetch(getRoleId(srcRoleStr));
    const newRolePromise = message.guild.roles.fetch(getRoleId(newRoleStr));
    
    const existingTimer = reminderCache[message.guild.id];
    if (existingTimer) {
        clearTimeout(existingTimer);
    }

	// Get resolved channel and role
	Promise.all([channelPromise, srcRolePromise, newRolePromise]).then(([channel, srcRole, newRole]) => {
		const time = semanticTimeArr.join(' ');
		const current = new Date(Date.now());
		const today = chrono.parse(`today ${time}`)[0].date();
		const tomorrow = chrono.parse(`in one day ${time}`)[0].date();

		// Figure out whether the next time the time will occur is today or tomorrow
		let timeUntilRemind;
		if (current < today) {
			timeUntilRemind = today - current;
		} else {
			timeUntilRemind = tomorrow - current;
        }
        
        // Set the cache for what the donation is role is for the channel's guild
        set(channel.guild.id, newRole);

		// Start the daily timer which will
		// 1. Output all people who have the newRole
		// 2. Assign all people who have srcRole with newRole
		setIntervalAfterTime(async () => {
            // 1. Output all people who have the newRole
            const usersWithNewRole = await getAllUsersWithRole(channel.guild, newRole);
            const usersWithNewRoleStr = usersWithNewRole.map((user) => `<@${user.id}>`).join(', ');
            channel.send(`The following users have not donated: ${usersWithNewRoleStr}`);

            // 2. Assign all people who have srcRole with newRole
            const usersWithSrcRole = await getAllUsersWithRole(channel.guild, srcRole);
            assignRoleToUsers(usersWithSrcRole, newRole)
                .then(channel.send('Donation roles have been assigned!'))
                .catch((reason) => channel.send(`An error has occurred: \`\`\` ${reason} \`\`\``));
        }, timeUntilRemind, 5000, (timeoutId) => {
            reminderCache[channel.guild.id] = timeoutId;
        });
        message.react('✅');
	});
};

module.exports = {
    name: 'setdonate',
    description: 'setdonate <channel> <src-role> <new-role> <semantic time>',
	execute,
};
