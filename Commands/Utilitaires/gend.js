import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'gend',
	helpname: 'gend <messsageId>',
	description: 'Permet de terminer un giveaway',
	help: 'gend <messageId>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		bot.giveawaysManager.end(args[0], null, {
			messages: {
				congrat: `🎉 Félicitations, {winners} a gagné {prize}`,
				error: 'Il n\'y a pas assez de participants'
			}
		})
	},
}