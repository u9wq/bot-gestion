import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import config from "../../config.json" with { type: 'json' }
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'serverbanner',
	helpname: 'serverbanner',
	description: "Affiche la bannière du serveur",
	help: 'serveurbanner',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const banner = message.guild.banner({ dynamic: true, size: 1024 });

		if (banner) {
			const embed = new EmbedBuilder()
				.setTitle(`Bannière - ${message.guild.name}`)
				.setImage(banner)
				.setColor(config.color);

			const downloadButton = new ButtonBuilder()
				.setLabel("Télécharger")
				.setStyle(ButtonStyle.Link)
				.setURL(banner);

			const actionRow = new ActionRowBuilder().addComponents(downloadButton);

			return message.reply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false } });
		} else {
			return message.reply({ content: 'Ce serveur n\'a pas de bannière.', allowedMentions: { repliedUser: false } });
		}
	},
}