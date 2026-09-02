import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'greroll',
	helpname: 'greroll <messageId>',
	description: 'Permet de prendre un nouveau gagnant pour un giveaway',
	help: 'greroll <messageId>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		bot.giveawaysManager.reroll(args[0], {
			messages: {
				congrat: `🎉 Félicitations, {winners} est le nouveau gagnant`,
				error: 'Il n\'y a pas assez de participants'
			}
		})
	},
}