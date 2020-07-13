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