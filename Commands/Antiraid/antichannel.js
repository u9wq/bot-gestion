import db from '../../Events/loadDatabase.js';
import config from '../../config.json' with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'antichannel',
	helpname: 'antichannel <on/off>',
	description: "Active/désactive l'antichannel",
	help: 'antichannel on/off',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const guildId = message.guild.id;
		if (!args[0] || ['on', 'off'].includes(args[0].toLowerCase()) === false) {
			return message.reply({
				content: 'Usage : `' + config.prefix + 'antichannel <on/off>`',
				allowedMentions: { repliedUser: false }
			});
		}

		const status = args[0].toLowerCase() === 'on' ? 1 : 0;

		db.run(`INSERT INTO antiraid (guild, antichannel)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET antichannel = ?`,
			[guildId, status, status], (err) => {
				if (err) return message.reply('Erreur lors de la mise à jour des paramètres.');
				const response = status ?
					"L'antichannel a bien été activé." :
					"L'antichannel a bien été désactivé.";
				message.reply(response);
			});

	},
}