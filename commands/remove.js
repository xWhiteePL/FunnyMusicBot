const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "remove",
    description: "Usuwa piosenke z kolejki",
    usage: "rm <cyfra>",
    aliases: ["rm"],
  },

  run: async function (client, message, args) {
   const queue = message.client.queue.get(message.guild.id);
    if (!queue) return sendError("Nie ma nic w kolejce.",message.channel).catch(console.error);
    if (!args.length) return sendError(`Uzycie: ${client.config.prefix}\`remove <numer w kolejce>\``);
    if (isNaN(args[0])) return sendError(`Uzycie: ${client.config.prefix}\`remove <numer w kolejce>\``);
    if (queue.songs.length == 1) return sendError("There is no queue.",message.channel).catch(console.error);
    if (args[0] > queue.songs.length)
      return sendError(`Kolejka zawiera ${queue.songs.length} piosenek!`,message.channel).catch(console.error);
try{
    const song = queue.songs.splice(args[0] - 1, 1); 
    sendError(`❌ **|** Usunieto: **\`${song[0].title}\`** z kolejki.`,queue.textChannel).catch(console.error);
                   message.react("✅")
} catch (error) {
        return sendError(`:notes: An unexpected error occurred.\nPossible type: ${error}`, message.channel);
      }
  },
};
