import { EmbedBuilder } from 'discord.js';
import config from "../../config.json" with { type: 'json' }
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'userinfo',
	helpname: 'userinfo [mention/id]',
	description: "Permet d'afficher des informations sur un membre du serveur",
	help: 'userinfo [mention/id]',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const user = message.mentions.users.first() || (args[0] ? await bot.users.fetch(args[0]).catch(() => null) : message.author);

		if (!user) {
			return message.reply({ content: "L'utilisateur n'existe pas ou n'est pas sur le serveur.", allowedMentions: { repliedUser: false } });
		}

		const member = await message.guild.members.fetch(user.id);

		const embed = new EmbedBuilder()
			.setTitle(`Information - ${user.username}`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setColor(config.color)
			.addFields(
				{ name: 'Nom', value: user.tag, inline: true },
				{ name: 'Surnom', value: member.nickname || 'Aucun', inline: true },
				{ name: 'ID', value: user.id, inline: true },
				{ name: 'Compte créé le', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
				{ name: 'Sur le serveur depuis', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
				{ name: 'Rôles', value: member.roles.cache.map(role => role.name).join(', ') || 'Aucun', inline: false },
			)
			.setFooter({ text: bot.user.username });

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
}