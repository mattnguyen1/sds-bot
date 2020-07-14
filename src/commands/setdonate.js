const chrono = require('chrono-node');
const redisClient = require('../redisClient');
const {
	getRoleId, getChannelId, getAllUsersWithRole, assignRoleToUser, setIntervalAfterTime, assignRoleToUsers, stringifyJSON
} = require('../utils');
const { set } = require('./donate');

const TIME_IN_DAY_MS = 24 * 60 * 60 * 1000;
const reminderCache = {};

const clearCacheTimeout = (guildId) => {
    if (guildId in reminderCache) {
        clearTimeout(reminderCache[guildId]);
        delete reminderCache[guildId];
    }
}

const calculateTimeAndSetReminder = async (client, guildId, args) => {
    const {channelId, srRoleId, newRoleId, semanticTimeArr} = args;
    const guild = client.guilds.resolve(guildId);
    const channelPromise = client.channels.fetch(channelId);
	const srcRolePromise = guild.roles.fetch(srRoleId);
    const newRolePromise = guild.roles.fetch(newRoleId);
    
    const existingTimer = reminderCache[guildId];
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

        // Set redis cache
        redisClient.hset('donations', channel.guild.id, stringifyJSON(args));

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
        }, timeUntilRemind, TIME_IN_DAY_MS, (timeoutId) => {
            reminderCache[channel.guild.id] = timeoutId;
        });
    });
};

/**
 * @param {Message} message
 * @param {Object[]} args - setdonate <channel> <src-role> <new-role> <semantic time>
 */
const execute = (message, args) => {
	const [channelStr, srcRoleStr, newRoleStr, ...semanticTimeArr] = args;
    calculateTimeAndSetReminder(message.client, message.guild.id, {
        channelId: getChannelId(channelStr),
        srcRoleId: getRoleId(srcRoleStr),
        newRoleId: getRoleId(newRoleStr),
        semanticTimeArr,
    });
    message.react('✅');
};

module.exports = {
    name: 'setdonate',
    description: 'Assigns a donation role to all users of a given role at the specified time each day. Will also output all users who have the donation role before assigning.',
    usage: 'setdonate <channel> <src-role> <new-role> <semantic time>',
    example: 'setdonate #bots @Guild @Donation 12pm PDT',
    execute,
    calculateTimeAndSetReminder,
    clearCacheTimeout,
};
