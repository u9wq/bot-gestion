import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import config from '../../config.json' with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'serverpic',
	helpname: 'serverpic',
	aliases: [],
	description: "Affiche l'icône du serveur",
	help: 'serverpic',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;



		const guild = message.guild;
		const iconURL = guild.iconURL({ dynamic: true, size: 1024 });

		if (iconURL) {
			const embed = new EmbedBuilder()
				.setTitle(`Icône - ${guild.name}`)
				.setImage(iconURL)
				.setColor(config.color);

			const downloadButton = new ButtonBuilder()
				.setLabel("Je veux l'avoir")
				.setStyle(ButtonStyle.Link)
				.setURL(iconURL);

			const actionRow = new ActionRowBuilder().addComponents(downloadButton);

			return message.reply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false } });
		} else {
			return message.reply({ content: 'Ce serveur n\'a pas de pdp.', allowedMentions: { repliedUser: false } });
		}
	},
}