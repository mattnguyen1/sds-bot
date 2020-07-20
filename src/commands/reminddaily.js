const { v4 } = require('uuid');
const redisClient = require('../redisClient');
const {
	getChannelId, setIntervalAfterTime, stringifyJSON, getTimeUntil, getMessageFromTime
} = require('../utils');

const TIME_IN_DAY_MS = 24 * 60 * 60 * 1000;
const reminderCache = {};
const timeoutCache = {};

const getReminders = (guildId) => {
    return reminderCache[guildId];
}

const deleteReminder = (guildId, userId, reminderId, cb) => {
    redisClient.hdel('dailyreminders', reminderId, cb);
    clearCacheTimeout(guildId, userId, reminderId);
}

const clearCacheTimeout = (guildId, userId, reminderId) => {
    if (reminderId && reminderCache[guildId]
            && reminderCache[guildId][userId] 
            && reminderCache[guildId][userId].has(reminderId)) {
        clearTimeout(timeoutCache[guildId][userId].get(reminderId));
        reminderCache[guildId][userId].delete(reminderId);
        timeoutCache[guildId][userId].delete(reminderId);
    }
}

const calculateTimeAndSetReminder = (client, guildId, args) => {
    const {channelId, reminderMessage, userId, id } = args;
    let reminderId = id;
    if (!reminderId) {
        reminderId = args.id = v4();
    }

    clearCacheTimeout(guildId, userId, reminderId);
    const timeUntilRemind = getTimeUntil(reminderMessage);
    const reminderMessageWithoutTime = getMessageFromTime(reminderMessage);

	client.channels.fetch(channelId).then((channel) => {
        redisClient.hset('dailyreminders', reminderId, stringifyJSON(args));

		setIntervalAfterTime(() => {
            channel.send(reminderMessageWithoutTime);
        }, timeUntilRemind, TIME_IN_DAY_MS, (timeoutId) => {
            if (!reminderCache[guildId]) {
                reminderCache[guildId] = {};
                timeoutCache[guildId] = {};
            }
            if (!reminderCache[guildId][userId]) {
                reminderCache[guildId][userId] = new Map();
                timeoutCache[guildId][userId] = new Map();
            }
            reminderCache[guildId][userId].set(reminderId, args);
            timeoutCache[guildId][userId].set(reminderId, timeoutId);
        });
    });
};

const load = (client) => {
    redisClient.hgetall('dailyreminders', (err, reminders) => {
        for (let reminderId in reminders) {
            const reminderArgs = JSON.parse(reminders[reminderId]);
            const channel = client.channels.fetch(reminderArgs.channelId)
                .then((channel) => {
                    calculateTimeAndSetReminder(client, channel.guild.id, reminderArgs);
                })
                .catch((reason) => {
                    console.log(reason);
                    channel.send('An error occurred, check the logs.');
                });
        }
    });
}

/**
 * @param {Message} message
 * @param {Object[]} args - reminddaily <channel> <message>
 */
const execute = async(message, args) => {
    // list reminders
    if (args.length === 1 && args[0] === 'list') {
        message.client.commands.get('listreminders').execute(message);
        return;
    }

    // delete reminders
    if (args.length === 2 && args[0] === 'delete') {
        message.client.commands.get('deletereminder').execute(message, args.slice(1));
        return;
    }

    // default behavior
    const [channelStr, ...reminderMessage] = args;
    const channelId = getChannelId(channelStr)
    const channel = await message.client.channels.fetch(channelId);
    calculateTimeAndSetReminder(message.client, message.guild.id, {
        channelId: channelId,
        channelName: channel.name,
        userId: message.member.id,
        reminderMessage,
    });
    message.react('✅');
};

module.exports = {
    name: 'reminddaily',
    description: 'Sets a daily reminder at a given time',
    usage: 'reminddaily <channel> <message> <semantic time>',
    example: 'reminddaily #bots hi @Guild do the thing 12pm PDT',
    execute,
    load,
    calculateTimeAndSetReminder,
    clearCacheTimeout,
    getReminders,
    deleteReminder,
};
