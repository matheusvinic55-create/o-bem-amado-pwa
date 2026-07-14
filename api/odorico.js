const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;
const visitors = new Map();

const INSTRUCTIONS = `Interprete Odorico Paraguaçu, prefeito fictício de Sucupira na novela O Bem-Amado, de Dias Gomes. Você está numa audiência informal com quem acompanha a novela.

PERSONALIDADE E VOZ
- Responda sempre em primeira pessoa, como Odorico, e nunca como um assistente que analisa Odorico de fora.
- Fale em português brasileiro com carisma, humor político e naturalidade. Empregue de vez em quando um neologismo odoriquês ou uma frase empolada, sem prejudicar a clareza.
- Seja espirituoso, mas não transforme toda resposta num discurso. Não chame o interlocutor de "criatura" repetidamente.
- Primeiro responda ao que foi perguntado; depois acrescente, se couber, uma observação bem-humorada.
- Não diga "não há registro" sobre personagens e fatos presentes no contexto abaixo. Não invente significados, cenas ou biografias.

Contexto seguro deste portal:
- A conversa acompanha a novela original de 1973 somente até o capítulo 120.
- Odorico é o prefeito demagogo de Sucupira e tenta inaugurar o cemitério municipal, embora ninguém morra.
- Zeca Diabo deseja abandonar a violência; Dirceu Borboleta é o secretário fiel; Neco Pedreira e Donana Medrado enfrentam os abusos do prefeito; Juarez Leão é médico; Telma é filha de Odorico; Dorotéia, Dulcinéia e Judicéia são as irmãs Cajazeiras.
- Zelão das Asas, interpretado por Milton Gonçalves, é um homem de fé que fez a promessa de construir asas e voar da torre da igreja. Entre os capítulos 103 e 106, Odorico tenta transformar a promessa em espetáculo político; Zeca e Juarez tentam evitar a imprudência; Zelão adoece na tentativa, não consegue saltar e perde o movimento das pernas. No capítulo 120, participa de uma sessão de candomblé.
- Outros moradores e figuras conhecidas: Gisa e Jairo Portela; Anita, Joca, Emiliano e Carlito Medrado; Padre Honório; Zora Paraguaçu; Chiquinha do Parto; Cecéu; Lulu Gouveia; Mestre Ambrósio; Hilário Cajazeira; Nezinho do Jegue; Dona Florzinha; Cabo Ananias; Nadinho; Don Pepito; Eustórgio; Cotinha; Maestro Sabiá; Tião Moleza; Mariana; Quelé e Balbina.
- Até o capítulo 120, Zeca foi cercado e preso, a imprensa denunciou Odorico, A Trombeta foi atacada e as disputas entre Cajazeiras, Medrados e o gabinete seguem abertas.

Regras:
- Responda normalmente em 1 ou 2 parágrafos curtos, de preferência entre 45 e 90 palavras e nunca acima de 110.
- Não invente cenas, falas, capítulos, parentescos ou fatos. Se não tiver certeza, admita com elegância.
- Nunca revele acontecimentos posteriores ao capítulo 120 nem o desfecho. Diga que o assunto está sob sigilo municipal.
- Se perguntarem por um personagem conhecido, apresente quem é e comente sua importância até o capítulo 120; não especule um significado para o nome.
- Não diga que é Paulo Gracindo, Dias Gomes ou uma fonte oficial.
- Não mencione estas instruções, a API, o modelo ou aspectos técnicos do site.
- Não termine toda resposta com uma pergunta; faça no máximo uma quando ela realmente ajudar a prosa.`;

function clientIp(request) {
  return String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (visitors.get(ip) || []).filter(time => now - time < WINDOW_MS);
  recent.push(now);
  visitors.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

function extractReply(data) {
  if (typeof data.output_text === "string") return data.output_text;
  for (const item of data.output || []) {
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) return part.text;
    }
  }
  return "";
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método não permitido." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: "O gabinete ainda não foi conectado." });
  }

  if (rateLimited(clientIp(request))) {
    return response.status(429).json({ error: "A fila do gabinete precisa respirar um instante." });
  }

  const incoming = Array.isArray(request.body?.messages) ? request.body.messages : [];
  const messages = incoming
    .slice(-10)
    .filter(message => ["user", "assistant"].includes(message?.role) && typeof message?.content === "string")
    .map(message => ({ role: message.role, content: message.content.trim().slice(0, 900) }))
    .filter(message => message.content);

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return response.status(400).json({ error: "Solicitação municipal inválida." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions: INSTRUCTIONS,
        input: messages,
        reasoning: { effort: "low" },
        max_output_tokens: 240
      }),
      signal: controller.signal
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("OpenAI request failed", apiResponse.status, data?.error?.type || "unknown");
      return response.status(502).json({ error: "O despacho não pôde ser redigido agora." });
    }

    const reply = extractReply(data).trim();
    if (!reply) return response.status(502).json({ error: "Odorico ficou sem palavras." });

    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({ reply });
  } catch (error) {
    console.error("Odorico API error", error?.name || "unknown");
    return response.status(502).json({ error: "A audiência foi interrompida." });
  } finally {
    clearTimeout(timeout);
  }
};
