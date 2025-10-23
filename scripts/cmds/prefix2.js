const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "1.5",
    author: "DAEMON",
    countDown: 5,
    role: 0,
    description: "Change the bot prefix in this chat or globally (admin only)",
    category: "system",
    guide: {
      en:
        "╭─『 ✨ PREFIX COMMAND ✨ 』\n" +
        "│\n" +
        "│ 🔹 {pn} <newPrefix>\n" +
        "│     ➥ Set a new prefix for this chat only\n" +
        "│     ➤ Example: {pn} $\n" +
        "│\n" +
        "│ 🔹 {pn} <newPrefix> -g\n" +
        "│     ➥ Set a new global prefix (admin only)\n" +
        "│     ➤ Example: {pn} ! -g\n" +
        "│\n" +
        "│ ♻️ {pn} reset\n" +
        "│     ➥ Reset to default prefix from config\n" +
        "│\n" +
        "│ 📌 Just type: prefix\n" +
        "│     ➥ Shows current prefix info\n" +
        "╰─────────────────────────────"
    }
  },

  langs: {
    en: {
      reset: "✅ Reset to default prefix: %1",
      onlyAdmin: "⛔ Only bot admins can change global prefix!",
      confirmGlobal: "⚙️ React to confirm global prefix update.",
      confirmThisThread: "⚙️ React to confirm this chat's prefix update.",
      successGlobal: "✅ Global prefix updated: %1",
      successThisThread: "✅ Chat prefix updated: %1"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix,
      setGlobal: args[1] === "-g"
    };

    if (formSet.setGlobal && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }

    const confirmMessage = formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    return message.reply(confirmMessage, (err, info) => {
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    }

    await threadsData.set(event.threadID, newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", newPrefix));
  },

  onChat: async function ({ event, message, threadsData, usersData }) {
    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;

    if (event.body && event.body.toLowerCase() === "prefix") {
      const userName = await usersData.getName(event.senderID);

      return message.reply(
        `👋 𝐇𝐞𝐲 ${userName}, 𝐝𝐢𝐝 𝐲𝐨𝐮 𝐚𝐬𝐤 𝐟𝐨𝐫 𝐦𝐲 𝐩𝐫𝐞𝐟𝐢𝐱?\n` +
        `➥ 🌐 𝐆𝐥𝐨𝐛𝐚𝐥: ${globalPrefix}\n` +
        `➥ 💬 𝐓𝐡𝐢𝐬 𝐂𝐡𝐚𝐭: ${threadPrefix}\n` +
        `𝐈'𝐦 , SAYEN'Z  𝐧𝐢𝐜𝐞 𝐭𝐨 𝐦𝐞𝐞𝐭 𝐲𝐨𝐮! `
      );
    }
  }
};
