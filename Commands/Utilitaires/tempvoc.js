import Discord from "discord.js"
import { EmbedBuilder } from "discord.js";
import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'tempvoc',
	helpname: 'tempvoc <off/salon> <catégorie>',
	description: 'Permet de configurer le salon vocal temporaire',
	help: 'tempvoc <off/salon> <catégorie>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const errorEmbed = new EmbedBuilder()
			.setDescription(`Utilisation: ${config.prefix}tempvoc <salon> <catégorie id>\``)
			.setColor(config.color)

		let arg = message.content.trim().split(/ +/g);
		if (!arg[1] && args[0] && args[0].toLowerCase() === 'off') {
			db.run('DELETE FROM tempvoc WHERE guildId = ?', [message.guild.id], (err) => {
				if (err) return message.reply({ embeds: [errorEmbed.setDescription("Une erreur est survenue lors de la suppression de la configuration.")] });
				return message.reply({ embeds: [errorEmbed.setDescription("Les vocaux temporaire ont été supprimée.")] });
			});
			return;
		}

		if (!arg[1]) return message.reply({ embeds: [errorEmbed] });

		let channel = message.guild.channels.cache.get(args[0]) || message.mentions.channels.first();
		if (!channel) return message.reply({ embeds: [errorEmbed] });

		let categoryId = args[1];
		if (!categoryId) return message.reply({ embeds: [errorEmbed] });
		const category = message.guild.channels.cache.get(categoryId);
		if (!category || category.type !== Discord.ChannelType.GuildCategory) {
			return message.reply({ embeds: [errorEmbed.setDescription("L'ID de catégorie n'est pas valide")] });
		}


		db.get(`SELECT * FROM tempvoc WHERE guildId = ?`, [message.guild.id], (err, row) => {
			if (err) throw err;

			if (!row) {
				db.run(`INSERT INTO tempvoc (guildId, channel, category) VALUES (?, ?, ?)`, [message.guild.id, channel.id, categoryId]);
			} else {
				db.run(`UPDATE tempvoc SET channel = ? WHERE guildId = ?`, [channel.id, message.guild.id]);
				db.run(`UPDATE tempvoc SET category = ? WHERE guildId = ?`, [categoryId, message.guild.id]);
			}

			const embed = new EmbedBuilder()
				.setColor(config.color)
				.setDescription(`La vocal temporaire est configurée.\n> Catégorie: <#${categoryId}>\n> Salon: <#${channel.id}>`)
				.setTimestamp()

			message.channel.send({ embeds: [embed] });
		});
	},
}