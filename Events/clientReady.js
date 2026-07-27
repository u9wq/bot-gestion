import { updateStats } from './updateStats.js';

export default {
    name: 'clientReady',
    async execute(bot) {
        await bot.application.commands.set(bot.arrayOfSlashCommands);
        // Mise à jour des stats toutes les 5 minutes
        setInterval(async () => {
            for (const guild of bot.guilds.cache.values()) {
                await updateStats(guild);
            }
        }, 60 * 1000);
    }
};