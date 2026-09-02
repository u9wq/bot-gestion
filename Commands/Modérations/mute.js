import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from '../../Utils/config.js';
import sendLog from "../../Events/sendlog.js";
import ms from "ms";
import { denyIfNoPerm } from '../../Utils/perms.js';
import { prevenirMembre } from '../../Utils/sanction.js';

export const command = {
	name: 'mute',
	helpname: 'mute <mention/id> [1s/1m/1h/1d]',
	description: "Mute un membre.",
	help: 'mute <mention/id> [1s/1m/1h/1d]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
		if (!member) {
			return message.reply("Utilisateur introuvable.");
		}

		if (message.member.roles.highest.position <= member.roles.highest.position) {
			return message.reply("Vous ne pouvez pas mute un membre supérieur à vous.");
		}

		let duration = args[1];
		let ms;
		if (!duration) {
			ms = 40 * 60 * 1000;
		} else {
			const match = duration.match(/^(\d+)(s|m|h|d)$/);
			if (!match) {
				return message.reply("Format du temps invalide. Exemples : 10m, 2h, 1d, 30s");
			}
			const value = parseInt(match[1]);
			const unit = match[2];
			switch (unit) {
				case 's': ms = value * 1000; break;
				case 'm': ms = value * 60 * 1000; break;
				case 'h': ms = value * 60 * 60 * 1000; break;
				case 'd': ms = value * 24 * 60 * 60 * 1000; break;
				default: ms = 40 * 60 * 1000;
			}
			const MAX_MUTE = 40 * 60 * 1000; // 40 minutes
			if (ms > MAX_MUTE) return message.reply("❌ Durée maximale : 40 minutes.");
		}

		try {
			await prevenirMembre(member, message.guild, 'mute', 'Mute temporaire', config, duration || '40m');
			await member.timeout(ms);
			message.reply(`<@${member.id}> a été mute pour ${duration ? duration : "40m"}.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a mute <@${member.id}> (${member.id}) pendant ${duration ? duration : "28j"}.`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
		} catch (error) {
			console.error('Erreur lors du mute :', error);
			return message.reply("Impossible de mute.");
		}
	},
}