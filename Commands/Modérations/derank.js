import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'derank',
	helpname: 'derank <mention/id> <raison>',
	description: "Permet de derank un membre.",
	help: 'derank <mention/id> <raison>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const user = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
		if (!user) {
			return message.reply("L'utilisateur n'existe pas.");
		}

		if (message.member.roles.highest.position <= user.roles.highest.position) {
			return message.reply("Vous ne pouvez pas derank un membre supérieur à vous.");
		}

		const reason = args.slice(1).join(' ');
		if (!reason) {
			return message.reply("Veuillez fournir une raison.");
		}

		try {
			await user.roles.set([]);
			message.reply(`<@${user.id}> a été derank.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a derank <@${user.id}> (${user.id}) pour ${reason}`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
		} catch (error) {
			console.error('Erreur lors du retrait des rôles :', error);
			return message.reply("Une erreur est survenue.");
		}

		db.run(`INSERT INTO sanctions (userId, raison, date, guild) VALUES (?, ?, ?, ?)`, [user.id, reason + '- Derank', new Date().toISOString(), message.guild.id], function (err) {
			if (err) {
				console.error('Erreur lors de l\'ajout de la sanction :', err);
				return message.reply("Une erreur est survenue.");
			}

		});
	},
}