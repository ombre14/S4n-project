const axios = require("axios");

const Prefixes = ["ai"];
const RP = "Ajoute des Emojis et répond à la question";

const fonts = {
  a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶",
  j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿",
  s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
  A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜",
  J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥",
  S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭"
};

function applyFont(text) {
  return text.split('').map(char => fonts[char] || char).join('');
}

function splitMessage(text, max = 2000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += max) {
    chunks.push(text.substring(i, i + max));
  }
  return chunks;
}

function extractImages(text) {
  const regex = /(https?:\/\/[^\s]+?\.(jpg|jpeg|png|webp|gif))/gi;
  return [...new Set(text.match(regex) || [])];
}

async function sendImages(images, message) {
  for (const url of images) {
    try {
      const stream = await global.utils.getStreamFromURL(url);
      await message.reply({ attachment: stream });
    } catch (e) {
      console.log(`❌ Erreur image : ${url}`);
    }
  }
}

module.exports = {
  config: {
    name: "ai",
    version: "2.2",
    author: "DAEMON",
    countDown: 2,
    role: 0,
    shortDescription: "🤖 AI + images multiples",
    longDescription: "Pose une question à l’IA et reçois du texte stylisé et toutes les images en direct.",
    category: "ai",
    guide: "{pn} <question>"
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ").trim();
    if (!prompt) return message.reply("❌ Pose une question à l’IA.");

    try {
      const url = `https://haji-mix-api.gleeze.com/api/groq?ask=${encodeURIComponent(prompt)}&model=llama-3.3-70b-versatile&uid=56666&RP=${encodeURIComponent(RP)}&stream=True`;
      const res = await axios.get(url, { timeout: 20000 });

      const raw = res.data?.answer || res.data?.result || res.data?.message || "🤖 Aucune réponse reçue.";
      const styled = applyFont(raw);
      const images = extractImages(raw);
      const chunks = splitMessage(styled);
      const sent = [];

      for (const chunk of chunks) {
        const msg = await message.reply(chunk);
        sent.push(msg.messageID);
        global.GoatBot.onReply.set(msg.messageID, {
          commandName: this.config.name,
          author: event.senderID
        });
        setTimeout(() => global.GoatBot.onReply.delete(msg.messageID), 2 * 60 * 1000);
      }

      await sendImages(images, message);

      setTimeout(() => {
        for (const id of sent) api.unsendMessage(id);
      }, 60 * 1000);

    } catch (err) {
      console.error(err.message);
      return message.reply(applyFont("❌ Erreur de réponse IA."));
    }
  },

  onChat: async function ({ event, message, api }) {
    if (!event.body) return;
    const prefix = Prefixes.find(p => event.body.toLowerCase().startsWith(p.toLowerCase()));
    if (!prefix) return;

    const args = event.body.slice(prefix.length).trim().split(/\s+/);
    this.onStart({ message, args, event, api });
  },

  onReply: async function ({ event, message, Reply, api }) {
    if (event.senderID !== Reply.author) return;
    const prompt = event.body.trim();

    try {
      const url = `https://haji-mix-api.gleeze.com/api/groq?ask=${encodeURIComponent(prompt)}&model=llama-3.3-70b-versatile&uid=56666&RP=${encodeURIComponent(RP)}&stream=True`;
      const res = await axios.get(url, { timeout: 20000 });

      const raw = res.data?.answer || res.data?.result || res.data?.message || "🤖 Rien reçu.";
      const styled = applyFont(raw);
      const images = extractImages(raw);
      const chunks = splitMessage(styled);
      const sent = [];

      for (const chunk of chunks) {
        const msg = await message.reply(chunk);
        sent.push(msg.messageID);
        global.GoatBot.onReply.set(msg.messageID, {
          commandName: this.config.name,
          author: event.senderID
        });
        setTimeout(() => global.GoatBot.onReply.delete(msg.messageID), 120000);
      }

      await sendImages(images, message);

      setTimeout(() => {
        for (const id of sent) api.unsendMessage(id);
      }, 60 * 1000);

    } catch (err) {
      console.error(err.message);
      return message.reply(applyFont("❌ Réponse IA échouée."));
    }
  }
};
