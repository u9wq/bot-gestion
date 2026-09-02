import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'avatar',
	helpname: 'avatar <url>',
	description: "Permet de changer la photo de profil du bot",
	help: 'avatar <url>',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		if (args.length === 0) {
			return
		}

		const avatarURL = args[0];

		try {
			await bot.user.setAvatar(avatarURL);
			return message.reply({ content: "La photo de profil a bien été changée.", allowedMentions: { repliedUser: false } });
		} catch (error) {
			console.error(error);
			return message.reply({ content: "Une erreur est survenue.", allowedMentions: { repliedUser: false } });
		}
	},
}