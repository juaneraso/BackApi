import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios"; // Se usa axios para manejar las solicitudes a la API
import express from "express";
//import { promises as fs, read } from "fs";
import OpenAI from "openai";

import morgan from "morgan";

import { runCommands } from "rhubarb-lip-sync";

import fs from 'fs';
import path from 'path';
//import { CommandExecutor } from './node_modules/rhubarb-lip-sync/index.js'; // Ajusta la importación según la ubicación exacta
//import mensaje from "./audios/message_0.json" assert { type: "json" };


dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-",
});
console.log("ELEVEN_LABS_API_KEY:", process.env.ELEVEN_LABS_API_KEY ? "Present" : "Missing");

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

//const voiceID = "ZpEtuMdTIlJXYXAhevhG"; 
const voiceID = process.env.VOICE_API_KEY;// Asegúrate de usar el ID correcto de la voz.
const modelID = "eleven_multilingual_v2";

//vqoh9orw2tmOS3mY7D2p  (Sofia)
//YPh7OporwNAJ28F5IQrm (angie)

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
const port = 3003;

app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};


// const audioPath = './audios/api_0.mp3';
// const audioBuffer = fs.readFileSync(audioPath);

// // Ejecuta el proceso
// runCommands(audioBuffer)
//   .then((outputJSONContent) => {
//     console.log('Contenido del JSON de sincronización labial:', outputJSONContent);
//   })
//   .catch((error) => {
//     console.error('Error al procesar el archivo:', error.message);
//   });

const lipSyncMessage = async (message) => {
  //console.log(message)
  const time = new Date().getTime();
  //const audioPath = path.join(__dirname, `/audios/message_${message}.mp3`);
  const audioPath = `./audios/message_${message}.mp3`;
  const outputJsonPath = `./audios/message_${message}.json`;

  //console.log(`Iniciando conversión para el mensaje ${message}...`);

  try {
    // Leer el archivo MP3 como buffer
    const audioBuffer = fs.readFileSync(audioPath);

    // Ejecutar el proceso de conversión y lip-sync
    const outputJSONContent = await runCommands(audioBuffer);

    //console.log(`Conversión y lip-sync completados en ${new Date().getTime() - time} ms`);
    //console.log('Contenido del JSON de sincronización labial:', outputJSONContent);

    await fs.promises.writeFile(outputJsonPath,outputJSONContent);

    console.log(`Archivo JSON guardado en ${outputJsonPath}`);

  } catch (error) {
    console.error('Error al procesar el archivo:', error.message);
  }
};





app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
 
  // Saludo inicial
  if (userMessage=='1') {
    res.send({
      messages: [
        {
          text: "Hey dear... How was your day?",
          audio: await audioFileToBase64("./audios/saludo.wav"),
          lipsync: await readJsonTranscript("./audios/saludo.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("./audios/saludo2.wav"),
          lipsync: await readJsonTranscript("./audios/saludo2.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("./audios/camara_1.wav"),
          lipsync: await readJsonTranscript("./audios/camara_1.json"),
          facialExpression: "smile",
          animation: "Talking_0",
        },      
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("./audios/saludo3.wav"),
          lipsync: await readJsonTranscript("./audios/saludo3.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },   
      ],
    });
    return;
  }



  if (!elevenLabsApiKey || openai.apiKey === "-") {
    res.send({
      messages: [
        {
          text: "Please my dear, don't forget to add your API keys!",
          audio: await audioFileToBase64("audios/api_0.wav"),
          lipsync: await readJsonTranscript("audios/api_0.json"),
          facialExpression: "angry",
          animation: "Angry",
        },
        {
          text: "You don't want to ruin Wawa Sensei with a crazy ChatGPT and ElevenLabs bill, right?",
          audio: await audioFileToBase64("audios/api_1.wav"),
          lipsync: await readJsonTranscript("audios/api_1.json"),
          facialExpression: "smile",
          animation: "Laughing",
        },
      ],
    });
    return;
  }

  const completion = await openai.chat.completions.create({
    // model: "gpt-3.5-turbo-1106",
    model: "gpt-3.5-turbo-1106",
    max_tokens: 1000,
    temperature: 0.6,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: `
        Eres una inteligencia artificial que se llama Alice, de la camara de comercio de San Juan de Pasto, 
        vas a ser la que de la bienvenida en un congreso y responderas preguntas de todo tipo. Este es el contexto del congreso:
        "Segundo congreso Financiero con enfoque en la Transformación Digital, 
        que se llevará a cabo los días 17 y 18 de octubre en la ciudad de San Juan de Pasto, 
        organizado por la Cámara de Comercio de Pasto.Este evento, que congrega a actores clave del sector financiero y empresarial, 
        abordará las nuevas tendencias y herramientas digitales que están transformando el ecosistema financiero en Colombia y el mundo.   
        Siempre responderás con un arreglo JSON de mensajes, con un máximo de 3 mensajes.
        Cada mensaje tiene una propiedad de texto, facialExpression y animation property.
        Las diferentes expresiones faciales son: smile, sad, angry, surprised, funnyFace y default.
        Las diferentes animaciones son: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, y Angry.
        `,
      },
      {
        role: "user",
        content: userMessage || "Hello",
      },
    ],
  });
  

  let messages = JSON.parse(completion.choices[0].message.content);
  if (messages.messages) {
    messages = messages.messages; // ChatGPT es inconsistente a veces
  }

  //console.log(messages);

  // Generación de audio con Eleven Labs
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const fileName = `audios/message_${i}.mp3`;
    const textInput = message.text;

    //console.log(textInput);

    try {
      // Configura los parámetros de fluidez y estabilidad
      const stability = 0.4;
      const similarityBoost = 0.95;
      const use_speaker_boost = true;

      // Llamada a la API de Eleven Labs utilizando axios para generar el archivo de audio
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`,
        {
          text: textInput,
          voice_settings: {
            stability: stability,
            similarity_boost: similarityBoost,
            use_speaker_boost: use_speaker_boost,
          },
          model_id: modelID,
        },
        {
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsApiKey,
          },
          responseType: "arraybuffer",
        }
      );

      await fs.promises.writeFile(fileName, response.data);

      // Generar lip sync

      await lipSyncMessage(i);

      // Asignar audio y lip sync al mensaje
      message.audio = await audioFileToBase64(fileName);
      message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
      //message.lipsync = mensaje; 

    } catch (error) {
      console.error("Error generating audio:", error);
    }
  }

  res.send({ messages });
});




const readJsonTranscript = async (file) => {
  const data = await fs.promises.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.promises.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});

