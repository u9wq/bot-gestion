import { EmbedBuilder } from 'discord.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'serverinfo',
	helpname: 'serverinfo',
	description: "Affiche les informations du serveur",
	help: 'serverinfo',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const owner = await message.guild.fetchOwner();
		const embed = new EmbedBuilder()
			.setTitle(`Information - ${message.guild.name}`)
			.setThumbnail(message.guild.iconURL({ dynamic: true, size: 1024 }))
			.setColor(config.color)
			.addFields(
				{ name: 'Nom', value: message.guild.name, inline: true },
				{ name: 'ID', value: message.guild.id, inline: true },
				{ name: 'Propriétaire', value: `${owner.user.tag}`, inline: true },
				{ name: 'Membres', value: `${message.guild.memberCount}`, inline: true },
				{ name: 'Boosts', value: `${message.guild.premiumSubscriptionCount}`, inline: true },
				{ name: 'Rôles', value: `${message.guild.roles.cache.size}`, inline: true },
				{ name: 'Date de création', value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:F>`, inline: false },
			)
			.setImage(message.guild.bannerURL({ dynamic: true, size: 1024 }));

	},
}