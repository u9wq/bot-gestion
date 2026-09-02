import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import config from '../../config.json' with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'pic',
	helpname: 'pic [mention/id]',
	aliases: [],
	description: "Permet d'afficher la photo de profil d'une personne",
	help: 'pic [mention/id]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		let user = message.mentions.users.first() || (args[0] ? await bot.users.fetch(args[0]).catch(() => null) : message.author);

		if (!user) {
			return message.reply({ content: "L'utilisateur n'existe pas", allowedMentions: { repliedUser: false } });
		}
		const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

		const embed = new EmbedBuilder()
			.setTitle(`${user.username}`)
			.setImage(avatarURL)
			.setColor(config.color);

		const jeveux = new ButtonBuilder()
			.setLabel("Je veux l'avoir")
			.setStyle(ButtonStyle.Link)
			.setURL(avatarURL);

		const actionRow = new ActionRowBuilder().addComponents(jeveux);

		return message.reply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false } });
	},
};