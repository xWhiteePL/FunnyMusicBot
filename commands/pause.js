const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "pause",
    description: "By zatrzymac aktualnie grana piosenke",
    usage: "[pause]",
    aliases: ["pause"],
  },

  run: async function (client, message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
	    try{
      serverQueue.connection.dispatcher.pause()
	  } catch (error) {
        message.client.queue.delete(message.guild.id);
        return sendError(`:notes: Piosenka zostala zatrzymana, a kolejka wyczyszczona.: ${error}`, message.channel);
      }	    
      let xd = new MessageEmbed()
      .setDescription("⏸ Zatrzymalem muzyke!")
      .setColor("YELLOW")
      .setTitle("Muzyka zostala zatrzymana!")
      return message.channel.send(xd);
    }
    return sendError("Zadna piosenka nie jest wlaczona na tym serwerze.", message.channel);
  },
};
