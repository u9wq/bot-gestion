import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from "../../config.json" with { type: 'json' }
import * as Discord from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'helpall',
	helpname: 'helpall',
	description: "Permet d'afficher la liste des commandes par permissions",
	help: 'helpall',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		db.all(`SELECT * FROM cmdperm WHERE guild = ?`, [message.guild.id], (err, rows) => {
			if (err) {
				console.error('Erreur lors de la récupération des commandes:', err);
				return;
			}

			const embed = new Discord.EmbedBuilder()
				.setTitle('Liste des Commandes par Permissions')
				.setColor(config.color)
				.setFooter({ text: `${config.prefix}perms pour voir quelles permissions sont liées à chaque rôle` });

			const publicCommands = rows.filter(row => row.perm === 'public').map(row => `\`${row.command}\``);
			embed.addFields({
				name: 'Public',
				value: publicCommands.length > 0 ? publicCommands.join(', ') : ' ',
			});

			for (let i = 1; i <= 12; i++) {
				const commands = rows.filter(row => row.perm === i).map(row => `\`${row.command}\``);
				embed.addFields({
					name: `Permissions ${i}`,
					value: commands.length > 0 ? commands.join(', ') : ' '
				});
			}

			message.reply({ embeds: [embed] });
		});
	},
};