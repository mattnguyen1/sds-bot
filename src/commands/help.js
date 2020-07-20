const Discord = require('discord.js');
const { prefix } = require('../config/conf.json');

const execute = (message, args) => {
    const { channel } = message;
    const helpCommands = message.client.commands.filter((cmd) => !!cmd.description).map((cmd) => {
        let helpMessage = cmd.description;
        if (cmd.usage) helpMessage += '\n usage:\n\t\t `' + prefix + cmd.usage + '`';
        if (cmd.example) helpMessage += '\n example:\n\t\t `' + prefix + cmd.example + '`';
        return {
            name: prefix + cmd.name,
            value: helpMessage,
        }
    });
    const helpEmbed = new Discord.MessageEmbed()
        .setColor('#0384fc')
        .setTitle('Available Commands')
        .setThumbnail('https://i.imgur.com/EEhuFav.png')
        .setImage('https://i.imgur.com/EEhuFav.png')
        .addFields(...helpCommands);
    channel.send(helpEmbed);
};

module.exports = {
    name: 'help',
	execute,
};
