const chrono = require('chrono-node');

module.exports.getRoleId = function (role) {
	const matches = role.match(/^<@&(\d+)>$/);

	if (!matches) {
		throw new Error('role is formatted incorrectly');
	}

	return matches[1];
};

module.exports.getChannelId = function (channel) {
	const matches = channel.match(/^<#(\d+)>$/);

	if (!matches) {
		throw new Error('channel is formatted incorrectly');
	}

	return matches[1];
};

/**
 * Get all users that have the given role
 * @param {Guild} guild
 * @param {Role} role
 * @returns {Promise}
 */
module.exports.getAllUsersWithRole = function (guild, role) {
	return guild.members.fetch()
		.then((members) => members.filter((member) => member.roles.cache.has(role.id)));
};

/**
 * Assigns a role to the user
 * @param {GuildMember} user
 * @param {Role} role
 * @returns {Promise}
 */
module.exports.assignRoleToUser = function (user, role) {
	return user.roles.add(role);
};

/**
 * Removes a role from the user
 * @param {GuildMember} user
 * @param {Role} role
 * @returns {Promise}
 */
module.exports.removeRoleFromUser = function (user, role) {
    return user.roles.remove(role);
}

/**
 * Assigns a role to all users in a list
 * @param {GuildMember[]} userList
 * @param {Role} role
 * @returns {Promise}
 */
module.exports.assignRoleToUsers = function (userList, role) {
	const usersWithRoleListPromise = userList.map((user) => module.exports.assignRoleToUser(user, role));
	return Promise.all(usersWithRoleListPromise);
};

/**
 * A setInterval that can starts after a given time
 * @param {Function} callbackFn
 * @param {int} timeUntilStart
 * @param {int} intervalTime
 * @param {Function} timeoutIdCallback
 * @returns {void}
 */
module.exports.setIntervalAfterTime = function (callbackFn, timeUntilStart, intervalTime, timeoutIdCallback) {
	const timeoutId = setTimeout(() => {
		callbackFn();
		const intervalId = setInterval(async () => {
			callbackFn();
        }, intervalTime);
        // @NOTE: While one timer is a setTimeout and the other is a setInterval, you can technically
        // still use cleartimeout on either one and you do not have to specifically use setInterval,
        // which we can take advantage of for code simplicity in this case.
        timeoutIdCallback(intervalId);
    }, timeUntilStart);
    timeoutIdCallback(timeoutId);
    
};

/**
 * Stringifies a JSON, regardless of circular structure
 * @param  {Object} obj
 * @return {string}
 */
module.exports.stringifyJSON = function(obj) {
	let cache = [];
	return JSON.stringify(obj, function(key, value) {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) !== -1) {
				// Circular reference found, discard key
				return;
			}
			// Store value in our collection
			cache.push(value);
		}
		return value;
	});
}

/**
 * Returns the time until the given time indicated by the string array of the user's time-related message
 * @returns {int} - time in ms
 */
module.exports.getTimeUntil = function(semanticTimeArr) {
    const time = chrono.parse(semanticTimeArr.join(' '))[0].text;
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

    return timeUntilRemind;
}

module.exports.getMessageFromTime = function(semanticTimeArr) {
    const message = semanticTimeArr.join(' ');
    const chronoResult = chrono.parse(message)[0];
    const strBeforeTime = message.slice(0,chronoResult.index);
    const strAfterTime = message.slice(chronoResult.index + chronoResult.text.length);
    let reminderText = (strBeforeTime.length > strAfterTime.length) ? strBeforeTime : strAfterTime;
    reminderText = reminderText.trim();
    if (reminderText.indexOf('to') === 0 && reminderText.length > 3){
        reminderText = reminderText.substring(3);
    }

    return reminderText;
}