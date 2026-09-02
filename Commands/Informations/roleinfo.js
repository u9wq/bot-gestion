import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'roleinfo',
	helpname: 'roleinfo <mention/id>',
	description: "Affiche des informations sur un rôle",
	help: 'roleinfo <mention/id>',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

		if (!role) {
			return message.reply({ content: "Le rôle n'existe pas.", allowedMentions: { repliedUser: false } });
		}

		const memberCount = role.members.size;

		const embed = new EmbedBuilder()
			.setTitle(`Information sur le rôle`)
			.setColor(role.color || config.color)
			.addFields(
				{ name: 'Nom', value: role.name, inline: true },
				{ name: 'ID', value: role.id, inline: true },
				{ name: 'Couleur', value: role.hexColor, inline: true },
				{ name: 'Mention', value: role.mentionable ? 'Oui' : 'Non', inline: true },
				{ name: 'Affiché séparément', value: role.hoist ? 'Oui' : 'Non', inline: true },
				{ name: 'Nombre de membres', value: `${memberCount}`, inline: true },
				{ name: 'Permissions', value: role.permissions.toArray().map(perm => PermissionsBitField.Flags[perm]).join(', ') || 'Aucune permission', inline: false }
			)
			.setFooter({ text: bot.user.username });

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
}