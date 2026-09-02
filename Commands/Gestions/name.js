import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'name',
	helpname: 'name <texte>',
	description: "Permet de changer le nom",
	help: 'name <texte>',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args.length === 0) {
			return
		}

		const newName = args.join(' ');

		try {
			await bot.user.setUsername(newName);
			return message.reply({ content: `Le nouveau nom est magnifique (${newName})`, allowedMentions: { repliedUser: false } });
		} catch (error) {
			console.error(error);
			return message.reply({ content: `Une erreur est survenue`, allowedMentions: { repliedUser: false } });
		}
	},
};