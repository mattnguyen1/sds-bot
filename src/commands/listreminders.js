const { getReminders } = require('./reminddaily');

/**
 * @param {Message} message
 * @param {Object[]} args
 */
const execute = async (message, args) => {
    const reminders = getReminders(message.guild.id);
    let reminderList = '```';
    let index = 0;

    if (!reminders) {
        reminderList = 'No reminders currently active.';
        message.channel.send(reminderList);
        return;
    }

    const userReminders = reminders[message.member.id];
    userReminders.forEach((reminder) => {
        const { reminderMessage } = reminder;
        reminderList += `${++index}: ${reminderMessage.join(' ')}\n`;
    });
    reminderList += '```';
    if (index === 0) {
        reminderList = 'No reminders currently active.';
    }
    message.channel.send(reminderList);
};

module.exports = {
    name: 'listreminders',
    description: 'List all reminders of the message\'s guild.',
    usage: 'reminddaily list',
    execute,
};