import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'alladmins',
	helpname: 'alladmins',
	description: "Permet d'afficher la liste des administrateurs",
	help: 'alladmins',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const admins = message.guild.members.cache.filter(member => member.permissions.has(PermissionsBitField.Flags.Administrator));

		if (admins.size === 0) {
			return message.reply({ content: "Aucun administrateur/trices sur le serveur.", allowedMentions: { repliedUser: false } });
		}

		const embed = new EmbedBuilder()
			.setTitle('Liste des Administrateur/trices')
			.setDescription(admins.map(admin => `<@${admin.user.id}> - ${admin.user.id}`).join('\n'))
			.setColor(config.color)
			.setFooter({ text: bot.user.username });

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
}