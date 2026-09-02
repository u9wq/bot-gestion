import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'banner',
	helpname: 'banner [mention/id]',
	description: "Permet d'afficher la bannière d'une personne",
	help: 'banner [mention/id]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		let user = message.mentions.users.first() || (args[0] ? await bot.users.fetch(args[0]) : message.author);

		const fetched = await bot.users.fetch(user.id, { force: true });
		const bannerURL = fetched.bannerURL({ dynamic: true, size: 1024 });

		if (bannerURL) {
			const embed = new EmbedBuilder()
				.setTitle(`${user.username}`)
				.setImage(bannerURL)
				.setColor(config.color);

			const downloadButton = new ButtonBuilder()
				.setLabel("Télécharger")
				.setStyle(ButtonStyle.Link)
				.setURL(bannerURL);

			const actionRow = new ActionRowBuilder().addComponents(downloadButton);

			return message.reply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false } });
		} else {
			return message.reply({ content: 'Aucune bannière', allowedMentions: { repliedUser: false } });
		}
	},
}