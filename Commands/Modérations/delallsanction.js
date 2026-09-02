import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'delallsanction',
	helpname: 'delallsanction <mention/id>',
	description: 'Permet d\'effacer toutes les sanctions d\'un membre',
	help: 'delallsanction <mention/id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const user = message.mentions.users.first() || await bot.users.fetch(args[0]).catch(() => null);
		if (!user) return message.reply("L'utilisateur n'existe pas.");

		db.run(`DELETE FROM sanctions WHERE userId = ? AND guild = ?`, [user.id, message.guild.id], function (err) {
			if (err) {
				console.error('Erreur lors de la suppression des sanctions:', err);
				return
			}
			message.reply(`Toutes les sanctions de <${user.tag}> ont été supprimées.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a supprimé toutes les sanctions de <@${user.id}> (${user.id})`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
		});
	},
}