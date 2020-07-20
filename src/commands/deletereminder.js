const { deleteReminder, getReminders } = require('./reminddaily');

/**
 * @param {Message} message
 * @param {Object[]} args - deletereminder <id>
 */
const execute = async (message, args) => {
    const [indexStr] = args;
    const index = parseInt(indexStr) - 1;
    const reminders = getReminders(message.guild.id);
    const userReminders = reminders[message.member.id];
    
    if (userReminders) {
        const userRemindersArr = Array.from(userReminders.values());
        if (userRemindersArr[index]) {
            deleteReminder(message.guild.id, message.member.id, userRemindersArr[index].id, (err) => {
                if (!err) {
                    message.react('✅');
                }
            });
        }
    }
};

module.exports = {
    name: 'deletereminder',
    description: 'Deletes a reminder',
    usage: 'reminddaily delete <id>',
    execute,
};
