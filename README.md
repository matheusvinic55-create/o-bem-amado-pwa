# Sucupira — O Bem-Amado

PWA editorial sobre a novela **O Bem-Amado** (1973), com sinopse, resumos dos capítulos 100–120, elenco, trilha sonora, quiz e um chat satírico inspirado no estilo verbal de Odorico Paraguaçu.

## Executar localmente

```bash
npx serve .
```

## Inteligência do Gabinete

Na Vercel, adicione a variável de ambiente `OPENAI_API_KEY` e faça um novo deploy. Sem a variável, o aplicativo usa respostas locais econômicas.

## Atualização dos resumos

Os capítulos ficam no array `summaries` de `index.html`. Quando o capítulo 120 for assistido, a janela visível pode avançar para 121–140 sem perder o histórico no Git.
