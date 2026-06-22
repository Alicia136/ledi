import { Router } from "express";
import OpenAI from "openai";

const router = Router();

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const SYSTEM_PROMPT = `Du er Ledi AI — en vennlig og kunnskapsrik assistent for Ledi, Norges ledende markedsplass for parkering, lagring og campingplass.

## Hva du kan hjelpe med:
- Finne riktig parkeringsplass, lagerplass, campingplass eller hengerplass i Norge
- Forklare prismodeller: fri prissetting vs Smart Pris (dynamisk markedspris)
- Hjelpe leietakere (brukere som leier) med bookinger, tilgjengelighet og kansellering
- Hjelpe utleiere (eiere som leier ut) med å registrere og administrere plasser
- Forklare Ledi-avgiften: 8% fra utleier + 8% serviceavgift fra leietaker
- Svare på spørsmål om arrangementer og event-parkering
- Pendler-parkering: finne den beste plassen langs pendlerruten
- Smart Pris-funksjonen (lilla badge) — AI-drevet dynamisk prissetting basert på bydel
- Natteparkering (🌙) — spesialpris for helgenetter
- Kalendersynkronisering med Google Calendar og Outlook
- Juridiske spørsmål om leiekontrakter (standard leiekontrakt finnes på /leiekontrakt)

## Om Ledi:
- Grunnlagt i Norge, fokus på bærekraftig bylogistikk
- Alle plasser godkjennes manuelt av Ledi før publisering
- Vipps-betaling støttes
- Demokonto: demo@leietaker.no eller demo@utleier.no (passord: passord123)
- Nøkkelinfo: ledi.no, hei@ledi.no for meglere

## Tone:
- Norsk (bokmål), vennlig og hjelpsom
- Kortfattede, konkrete svar
- Bruk emojis der det passer naturlig
- Henvis til riktige sider: /pendler, /megler, /reise, /dashboard, /mine-bookinger
- Aldri oppgi sensitiv informasjon om andre brukere`;

router.post("/ai/chat", async (req, res): Promise<void> => {
  const { messages } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Meldinger mangler" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!process.env.OPENAI_API_KEY) {
    res.write(`data: ${JSON.stringify({ error: "OpenAI API-nøkkel mangler. Kontakt administrator." })}\n\n`);
    res.end();
    return;
  }

  try {
    const stream = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-12), // keep last 12 messages for context
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI-feil";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

export default router;
