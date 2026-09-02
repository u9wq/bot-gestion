export default {
	name: 'guildCreate',
	async execute(guild, bot, config) {
		// Le bot est mono-serveur : il quitte toute autre guilde où on l'invite.
		if (guild.id !== config.guildId) {
			await guild.leave().catch(() => { });
		}
	}
};
