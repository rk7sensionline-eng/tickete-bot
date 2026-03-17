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

const TOKEN = process.env.TOKEN;
const EMBED_COLOR = "#FF0000";
const TICKET_CATEGORY_ID = "1464757524656820254"; // ID da categoria
const SUPPORT_ROLE_ID = null;

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

// ─── Comando !ticket ──────────────────────────────────────────────────────────
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
      "Copyright © rk7sdev"
    )
    .setColor(EMBED_COLOR);

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

// ─── Interações ───────────────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {

  // ── Abrir ticket ──
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    // ✅ Sanitiza o nome do canal removendo caracteres inválidos
    const safeName = member.user.username
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");
    const nomeCanal = `ticket-${safeName || member.user.id}`;

    // ✅ Verifica ticket existente pelo nome
    const existing = guild.channels.cache.find(
      (c) => c.name === nomeCanal && c.type === ChannelType.GuildText
    );

    if (existing) {
      return interaction.editReply({
        content: `❌ Você já possui um ticket aberto: ${existing}`,
      });
    }

    // ✅ Busca a categoria pelo ID (não pelo nome)
    let category = guild.channels.cache.get(TICKET_CATEGORY_ID);

    if (!category) {
      category = await guild.channels.create({
        name: "tickets",
        type: ChannelType.GuildCategory,
      });
    }

    const permissionOverwrites = [
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
    ];

    if (SUPPORT_ROLE_ID) {
      permissionOverwrites.push({
        id: SUPPORT_ROLE_ID,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    const ticketChannel = await guild.channels.create({
      name: nomeCanal,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites,
    });

    const ticketEmbed = new EmbedBuilder()
      .setAuthor({
        name: "rk7s sensi",
        iconURL: guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `Olá ${member}, obrigado por abrir um ticket!\n\n` +
        "Nossa equipe irá te atender em breve.\n" +
        "Descreva o motivo do seu ticket abaixo.\n\n" +
        "Copyright © rk7sdev"
      )
      .setColor(EMBED_COLOR)
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

  // ── Fechar ticket ──
  if (interaction.isButton() && interaction.customId === "fechar_ticket") {
    await interaction.deferReply({ ephemeral: true });

    // ✅ Botão de confirmação antes de deletar
    const confirmBtn = new ButtonBuilder()
      .setCustomId("confirmar_fechar")
      .setLabel("Confirmar")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Danger);

    const cancelBtn = new ButtonBuilder()
      .setCustomId("cancelar_fechar")
      .setLabel("Cancelar")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

    await interaction.editReply({
      content: "⚠️ Tem certeza que deseja fechar este ticket?",
      components: [row],
    });
  }

  // ── Confirmar fechar ──
  if (interaction.isButton() && interaction.customId === "confirmar_fechar") {
    await interaction.reply({ content: "🔒 Fechando o ticket em 5 segundos...", ephemeral: true });
    setTimeout(async () => {
      await interaction.channel.delete().catch(console.error);
    }, 5000);
  }

  // ── Cancelar fechar ──
  if (interaction.isButton() && interaction.customId === "cancelar_fechar") {
    await interaction.reply({ content: "✅ Ação cancelada.", ephemeral: true });
  }
});

client.login(TOKEN);
