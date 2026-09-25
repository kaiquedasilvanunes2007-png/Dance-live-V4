# Dance Live — celular + Render

## Incluído
- Pista 3D procedural usando Three.js.
- Personagens originais gerados no navegador.
- Danças aleatórias.
- Nickname e pontuação por doador.
- Mesmo doador mantém o personagem.
- WebSocket em tempo real.
- Painel admin protegido por senha no servidor.
- Teste de presentes pelo celular.
- Fixar/desafixar/remover doadores.
- Música por upload durante a execução.
- Cores, qualidade, volume e limite de personagens.
- Render.com preparado.

## Publicar pelo celular
1. Crie um repositório no GitHub e envie todos estes arquivos.
2. No Render, crie um **Web Service** ligado ao repositório.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables:
   - `ADMIN_PASSWORD`: sua senha forte.
   - `SESSION_SECRET`: sequência longa aleatória (ou deixe o Render gerar pelo `render.yaml`).
6. Faça o deploy e abra a URL no Chrome do celular.
7. Toque em ⚙️ e entre com a senha.

## Música
O áudio enviado fica na memória da instância enquanto ela estiver rodando. Não é armazenamento permanente.

## TikTok
Não há uma API oficial inventada aqui. O projeto possui o fluxo de teste `/api/test-gift` e WebSocket. Para presentes reais, conecte um serviço/conector autorizado que encaminhe eventos para esse backend. O formato esperado é:
`{username,giftId,giftName,repeatCount,diamondCount}`.

## Senhas
Nunca coloque senha, token ou API key no frontend. Use as Environment Variables do Render.
