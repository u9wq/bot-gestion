import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder } from "discord.js";
import config from '../../Utils/config.js';
import sendLog from "../../Events/sendlog.js";
import ms from "ms";
import { denyIfNoPerm } from '../../Utils/perms.js';
import { prevenirMembre } from '../../Utils/sanction.js';

export const command = {
	name: 'vmute',
	helpname: 'vmute <mention/id> <durée> <raison>',
	description: "Permet de mute une personne en vocal.",
	help: 'vmute <mention/id> <1m/1h/1d> <raison>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const user = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
		if (!user) {
			return message.reply("L'utilisateur n'existe pas.");
		}
		if (message.member.roles.highest.position <= user.roles.highest.position) {
			return message.reply("Vous ne pouvez pas mute vocal un membre supérieur à vous.");
		}

		const duration = args[1];
		if (!duration || !ms(duration)) {
			return message.reply("Format: 1m, 1h, 1d");
		}

		const reason = args.slice(2).join(' ');
		if (!reason) {
			return message.reply("Veuillez fournir une raison.");
		}

		if (!user.voice.channel) {
			return message.reply("L'utilisateur n'est pas dans une vocal.");
		}

		try {
			await prevenirMembre(user, message.guild, 'vmute', reason, config, duration);
			await user.voice.setMute(true, reason);
			message.reply(`<@${user.id}> a été mute vocal  ${ms(ms(duration), { long: true })} pour ${reason}`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a mute <@${user.id}> (${user.id}) pendant ${ms(ms(duration), { long: true })} pour ${reason}`)
				.setTimestamp();

			sendLog(message.guild, embed, 'voicelog');
			setTimeout(async () => {
				try {
					await user.voice.setMute(false, "UnVmute");
					console.log(`${user.user.tag} a été unmute après ${duration}.`);
				} catch (error) {
					console.error(`Erreur lors du unmute de ${user.user.tag} :`, error);
				}
			}, ms(duration));
		} catch (error) {
			console.error('Erreur lors du mute vocal :', error);
			return message.reply("Une erreur est survenue.");
		}

		db.run(`INSERT INTO sanctions (userId, raison, date, guild) VALUES (?, ?, ?, ?)`, [user.id, `${reason} - Mute vocal (${duration})`, new Date().toISOString(), message.guild.id], function (err) {
			if (err) {
				console.error('Erreur lors de l\'ajout de la sanction :', err);
				return message.reply("Une erreur est survenue.");
			}
		});
	},
}