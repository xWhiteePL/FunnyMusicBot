const { MessageEmbed } = require('discord.js')

module.exports = {
    info: {
        name: "help",
        description: "To show all commands",
        usage: "[command]",
        aliases: ["commands", "help me", "pls help"]
    },

    run: async function(client, message, args){
        var allcmds = "";

        client.commands.forEach(cmd => {
            let cmdinfo = cmd.info
            allcmds+="`"+client.config.prefix+cmdinfo.name+" "+cmdinfo.usage+"` ~ "+cmdinfo.description+"\n"
        })

        let embed = new MessageEmbed()
        .setAuthor("Komendy  "+client.user.username, "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
        .setColor("BLUE")
        .setDescription(allcmds)
        .setFooter(`By zobaczyc informacje o pojedynczej komendzie mozesz napisac ${client.config.prefix}help [komenda]`)

        if(!args[0])return message.channel.send(embed)
        else {
            let cmd = args[0]
            let command = client.commands.get(cmd)
            if(!command)command = client.commands.find(x => x.info.aliases.includes(cmd))
            if(!command)return message.channel.send("Niepoprawna komenda")
            let commandinfo = new MessageEmbed()
            .setTitle("Komenda: "+command.info.name+" info")
            .setColor("YELLOW")
            .setDescription(`
Nazwa: ${command.info.name}
Opis: ${command.info.description}
Użycie: \`\`${client.config.prefix}${command.info.name} ${command.info.usage}\`\`
Skroty: ${command.info.aliases.join(", ")}
`)
            message.channel.send(commandinfo)
        }
    }
}
