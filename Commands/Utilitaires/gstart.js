import db from "../../Events/loadDatabase.js";
import ms from "ms";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'gstart',
	helpname: 'gstart <durée> <gagnant> <prix>',
	description: 'Permet de créer un giveaway',
	help: 'gstart <durée> <gagnant> <prix>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (!args[0] || !args[1] || !args[2]) return;

		let duration = args[0];
		if (!duration || isNaN(ms(duration))) return;

		let winnerCount = parseInt(args[1]);
		if (isNaN(winnerCount) || winnerCount <= 0) return;

		let prize = args.slice(2).join(" ");
		if (!prize) return;

		await message.delete();

		const bonusEntries = await new Promise(resolve => {
			db.all('SELECT userId, invites FROM giveaway_invites WHERE guildId = ?',
				[message.guild.id], (err, rows) => resolve(rows || []));
		});

		bot.giveawaysManager.start(message.channel, {
			duration: ms(duration),
			winnerCount: winnerCount,
			prize: prize,
			hostedBy: message.author,
			bonusEntries: bonusEntries.map(row => ({
				bonus: (user) => {
					if (user.id === row.userId) return row.invites;
					return null;
				},
				cumulative: true,
			})),
			messages: {
				giveaway: '',
				giveawayEnded: '',
				drawing: 'Fin dans: {timestamp}',
				inviteToParticipate: '',
				timeRemaining: `Temps restant: **{duration}**`,
				winMessage: `Felicitations, {winners} a gagne **${prize}**!`,
				noWinner: 'Pas assez de participant',
				winners: "Gagnant(s)",
				endedAt: "Termine",
				embedFooter: 'Termine',
				hostedBy: `Organise par: ${message.author}`,
			}
		});
	},
};