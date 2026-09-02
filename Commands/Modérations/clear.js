import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from '../../Utils/config.js';
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'clear',
	helpname: 'clear [nombre]',
	description: "Permet de supprimer le nombre de messages donné",
	help: 'clear [nombre]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		let amount = parseInt(args[0]);
		if (isNaN(amount) || amount < 1 || amount > 100) {
			amount = 100;
		} else {
			amount += 1;
		}

		const fetched = await message.channel.messages.fetch({ limit: amount });
		await message.channel.bulkDelete(fetched);
		const response = await message.channel.send(`Les messages viennent d'être supprimés par ${message.author}`);
		const embed = new Discord.EmbedBuilder()
			.setColor(config.color)
			.setDescription(`<@${message.author.id}> a supprimé ${amount - 1} messages dans le salon <#${message.channel.id}>`)
			.setTimestamp();

		sendLog(message.guild, embed, 'messagelog');
		setTimeout(() => {
			response.delete().catch(console.error);
		}, 3000);
	},
}