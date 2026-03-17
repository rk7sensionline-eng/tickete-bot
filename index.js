const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

const config = require("./config.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// ─── Comando !ticket ────────────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.content !== "!ticket") return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply("❌ Apenas administradores podem usar esse comando.");
  }

  await message.delete().catch(() => {});

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "rk7s sensi",
      iconURL: message.guild.iconURL({ dynamic: true }),
    })
    .setDescription(
      "**| Informações**\n" +
        "> Olá, se você está lendo isso aqui, provavelmente está precisando de ajuda\n" +
        "> clique no botão abaixo para tirar suas dúvidas\n\n" +
        "**| Horário de atendimento**\n" +
        "> Segunda a Sábado (12:00 até as 00:00 Horas)\n\n" +
        "Copyright © rk7sdev"
    )
    .setColor(config.embedColor);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("ticket_select")
    .setPlaceholder("Selecione uma opção para abrir um ticket!")
    .addOptions([
      {
        label: "Abrir Ticket",
        description: "Clique aqui para abrir um novo ticket.",
        value: "abrir_ticket",
        emoji: "📁",
      },
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await message.channel.send({ embeds: [embed], components: [row] });
});

// ─── Select Menu ─────────────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  // Abre ticket via select menu
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_select"
  ) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    // Verifica se já existe ticket aberto para o usuário
    const existing = guild.channels.cache.find(
      (c) =>
        c.name === `ticket-${member.user.username.toLowerCase().replace(/\s/g, "-")}` &&
        c.type === ChannelType.GuildText
    );

    if (existing) {
      return interaction.editReply({
        content: `❌ Você já possui um ticket aberto: ${existing}`,
      });
    }

    // Cria categoria se não existir
    let category = guild.channels.cache.find(
      (c) => c.name === config.ticketCategory && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: config.ticketCategory,
        type: ChannelType.GuildCategory,
      });
    }

    // Cria canal privado do ticket
    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username.toLowerCase().replace(/\s/g, "-")}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: config.supportRoleId || guild.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    // Embed dentro do ticket
    const ticketEmbed = new EmbedBuilder()
      .setAuthor({
        name: "rk7s sensi",
        iconURL: guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `Olá ${member}, obrigado por abrir um ticket!\n\n` +
          "Nossa equipe irá te atender em breve.\n" +
          "Descreva o motivo do seu ticket abaixo.\n\n" +
          "**| Horário de atendimento**\n" +
          "> Segunda a Sábado (12:00 até as 00:00 Horas)\n\n" +
          "Copyright © rk7sdev"
      )
      .setColor(config.embedColor)
      .setTimestamp();

    const closeBtn = new ButtonBuilder()
      .setCustomId("fechar_ticket")
      .setLabel("Fechar Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger);

    const btnRow = new ActionRowBuilder().addComponents(closeBtn);

    await ticketChannel.send({
      content: `${member}`,
      embeds: [ticketEmbed],
      components: [btnRow],
    });

    await interaction.editReply({
      content: `✅ Ticket aberto com sucesso! ${ticketChannel}`,
    });
  }

  // Fecha ticket via botão
  if (interaction.isButton() && interaction.customId === "fechar_ticket") {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;

    await interaction.editReply({ content: "🔒 Fechando o ticket em 5 segundos..." });

    setTimeout(async () => {
      await channel.delete().catch(console.error);
    }, 5000);
  }
});

client.login(config.token);
