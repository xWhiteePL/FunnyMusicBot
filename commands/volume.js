const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "volume",
    description: "By zmienic glosnosc",
    usage: "[volume]",
    aliases: ["v", "vol"],
  },

  run: async function (client, message, args) {
    const channel = message.member.voice.channel;
    if (!channel)return sendError("Musisz byc na kanale glosowym by uzyc tej komendy!", message.channel);
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return sendError("Nic nie jest wlaczone.", message.channel);
    if (!serverQueue.connection) return sendError("Nic nie jest wlaczone.", message.channel);
    if (!args[0])return message.channel.send(`Aktualna glosnosc wynosi: **${serverQueue.volume}**`);
     if(isNaN(args[0])) return message.channel.send(':notes: Tylko cyfry!').catch(err => console.log(err));
    if(parseInt(args[0]) > 150 ||(args[0]) < 0) return sendError('Nie mozesz ustawic glosnosci powyzej 150, i mniejszej niz 0',message.channel).catch(err => console.log(err));
    serverQueue.volume = args[0]; 
    serverQueue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);
    let xd = new MessageEmbed()
    .setDescription(`Ustawilem glosnosc na: **${args[0]/1}**`)
    .setAuthor("Regulator glosnosci", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
    .setColor("BLUE")
    return message.channel.send(xd);
  },
};
