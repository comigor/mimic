# Mimic

Versão estática (web) do clássico **Imagem & Ação** para jogar com a galera, em português brasileiro.

## Como jogar

1. Na tela inicial, escolha o número de times (2, 3 ou 4), o tempo por jogada (padrão: 60 s) e as categorias ativas.
2. Toque em **Iniciar partida** para abrir o tabuleiro, ou em **Modo livre (sem tabuleiro)** para jogar só com o sorteio de cartas.
3. No tabuleiro, a casa em que o time está define a categoria da carta. Toque em **Sortear carta**.
4. A tela fica coberta — passe o aparelho para o jogador da vez.
5. Ele toca em **Mostrar carta** para ver a palavra (só ele deve olhar!).
6. Ao tocar em **Começar**, o cronômetro inicia.
7. **Acertou!** para o tempo, rola o dado automaticamente e avança o peão. **Parar** passa a vez sem rolar.
8. Quando o tempo acaba, um alarme toca e a palavra é revelada.
9. O primeiro time a chegar na casa **FIM** (canto central do tabuleiro espiral 6×6) vence.

### Categorias

| Letra | Significado |
| ----- | ----------- |
| **P** | Pessoa, lugar ou animal |
| **O** | Objeto |
| **A** | Ação |
| **D** | Difícil |
| **L** | Lazer |
| **T** | Todos os times jogam ao mesmo tempo |

Palavras marcadas como `allPlay` (segundo elemento `1` no JSON, ver abaixo) também são jogadas por todos os times simultaneamente. Toda carta da categoria **T** é `allPlay` automaticamente.

## Rodando localmente

O app carrega as palavras via `fetch`, então é necessário servir por HTTP — abrir o `index.html` direto pelo `file://` não funciona.

```sh
python3 -m http.server 8000
# ou
npx --yes serve .
```

Depois abra <http://localhost:8000>.

## Adicionando palavras

As palavras ficam em `words/<letra>.json`, um arquivo por categoria (`p.json`, `o.json`, `a.json`, `d.json`, `l.json`, `t.json`). Cada arquivo é um array; cada entrada é um array `[palavra]` ou `[palavra, 1]`, onde `1` marca a carta como `allPlay`:

```json
[
  ["rainha"],
  ["bicho", 1]
]
```

A categoria é inferida pelo nome do arquivo — não a inclua na entrada. Entradas vazias ou duplicadas (mesma palavra na mesma categoria) são ignoradas no carregamento.

## Deploy

O workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) publica automaticamente em GitHub Pages a cada push na `main`. Para ativar, em **Settings → Pages**, selecione **GitHub Actions** como source.
