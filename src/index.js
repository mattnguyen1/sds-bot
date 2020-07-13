const Discord = require('discord.js');
const fs = require('fs');
const { token, prefix } = require('./config/conf.json');

const client = new Discord.Client();

// Event Handlers
const handleReady = () => {
	console.log('Ready');
};

const handleMessage = (message) => {
	// Ignore any messages by bots
	if (message.author.bot || message.content.indexOf(prefix) !== 0) {
		return;
	}
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

	try {
		const command = client.commands.get(commandName);
		if (command) {
			command.execute(message, args);
		}
	} catch (e) {
		console.log('uncaught error: ', e);
		message.channel.send('something went wrong, check the logs');
	}
};

// Helpers
function addEventListeners() {
	client.once('ready', handleReady);
	client.on('message', handleMessage);
}

function login() {
	client.login(token);
}

function loadCommands() {
	client.commands = new Discord.Collection();
	const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter((file) => file.endsWith('.js'));
	// eslint-disable-next-line no-restricted-syntax
	for (const file of commandFiles) {
		// eslint-disable-next-line global-require, import/no-dynamic-require
		const command = require(`./commands/${file}`);
		client.commands.set(command.name, command);
	}
}

function initializeBot() {
	addEventListeners();
	loadCommands();
	login();
}

// Run bot
initializeBot();
