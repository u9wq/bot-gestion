import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'warn',
	helpname: 'warn <mention/id> <raison>',
	description: "Permet de sanctionner un membre",
	help: 'warn <mention/id> <raison>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const user = message.mentions.users.first() || await bot.users.fetch(args[0]).catch(() => null);
		if (!user) {
			return message.reply("L'utilisateur n'existe pas.");
		}

		const member = message.guild.members.cache.get(user.id);
		if (member && message.member.roles.highest.position <= member.roles.highest.position) {
			return message.reply("Vous ne pouvez pas warn un membre supérieur à vous.");
		}

		const reason = args.slice(1).join(' ');
		if (!reason) {
			return message.reply("Veuillez fournir une raison.");
		}

		db.run(`INSERT INTO sanctions (userId, raison, date, guild) VALUES (?, ?, ?, ?)`, [user.id, reason, new Date().toISOString(), message.guild.id], function (err) {
			if (err) {
				console.error(err);
				return
			}

			message.reply(`<@${user.id}> a été warn pour: ${reason}`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a warn <@${user.id}> (${user.id}) pour ${reason}`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
		});
	},
}