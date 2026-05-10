# Mimic

Versão estática (web) do clássico **Imagem & Ação** para jogar com a galera, em português brasileiro.

## Como jogar

1. Configure o tempo (padrão: 60 s) e as categorias ativas.
2. O jogador da vez aperta **Sortear carta**.
3. A tela fica coberta — passe o aparelho para o jogador.
4. Ele toca em **Mostrar carta** para ver a palavra (só ele deve olhar!).
5. Ao tocar em **Começar**, o cronômetro inicia.
6. Quando o tempo acabar, um alarme toca e a palavra é revelada.

### Categorias

| Letra | Significado |
| ----- | ----------- |
| **P** | Pessoa, lugar ou animal |
| **O** | Objeto |
| **A** | Ação |
| **D** | Difícil |
| **L** | Lazer |
| **T** | Todos os times jogam ao mesmo tempo |

Palavras marcadas com `allPlay: true` (vindas de cartas com `*` na origem) também são jogadas por todos os times simultaneamente.

## Adicionando palavras

Edite [`words.js`](./words.js) e acrescente entradas no formato:

```js
{ word: "Palavra",  category: "P", allPlay: false }
```

## Deploy

O workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) publica automaticamente em GitHub Pages a cada push na `main`. Para ativar, em **Settings → Pages**, selecione **GitHub Actions** como source.
