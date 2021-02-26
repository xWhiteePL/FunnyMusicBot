const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error")

module.exports = {
  info: {
    name: "nowplaying",
    description: "By zobaczyc co aktualnie leci na serwerze",
    usage: "",
    aliases: ["np"],
  },

  run: async function (client, message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return sendError("Zadna piosenka aktualnie nie jest wlaczona.", message.channel);
    let song = serverQueue.songs[0]
    let thing = new MessageEmbed()
      .setAuthor("Aktualnie gram", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
      .setThumbnail(song.img)
      .setColor("BLUE")
      .addField("Nazwa", song.title, true)
      .addField("Dlugosc", song.duration, true)
      .addField("Wlaczona przez", song.req.tag, true)
      .setFooter(`Wyswietlenia: ${song.views} | ${song.ago}`)
    return message.channel.send(thing)
  },
};
