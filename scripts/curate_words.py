#!/usr/bin/env python3
"""
Curate the Mimic word corpus:
  - Remove typos / fabricated words / archaic & socially loaded terms /
    truly obscure 80s pop-culture deep cuts / dead-tech / misclassified
    entries.
  - Add modern, durable additions (>= 10 yrs cultural presence) across
    every category, with extra emphasis on movies (Disney, Brazilian,
    international), series, music, sports, modern tech objects, and
    everyday modern actions.

The script is idempotent: re-running on the curated corpus is a no-op
(removals already gone, additions already present are skipped).
"""
from __future__ import annotations

import json
import os

import unicodedata
from pathlib import Path

# scripts/curate_words.py lives at <repo>/scripts/, so words/ is one
# level up. Fall back to a relative path when invoked from the repo root.
ROOT = Path(__file__).resolve().parent.parent / "words"
if not ROOT.is_dir():
    ROOT = Path("words")

CATEGORIES = ["a", "d", "l", "o", "p", "t"]

# ---------- Removals (exact-string match against entry[0]) ----------
# Categorised by file. Rationale comments are kept terse.

REMOVALS: dict[str, list[str]] = {
    "a": [
        # typos / fabricated words
        "sufritar",
        "coleatar",
        "descarçar",
        "aquíçar",
        "embedecar-se",
        "enfiesar",
        "fuxilar",  # typo of "fuzilar", which is already present
        # nouns / adjectives miscategorised as actions
        "folheto",
        "neurótico",
        "régua",
        "redor",
        "meia-entrada",
        "talher de peixe",
        "olho no espelho",
        "LSD",
        "abridor de garrafas",
        "aliança",
        "segurança",
        "vingança",
        "ponteiro de relógio",
        # sensitive
        "cometer suicídio",
        # within-file duplicates handled automatically below.
    ],
    "d": [
        # fabricated / OCR garbage
        "vingamento",
        "quibumbo",
        "bicarquixa",
        "rasilho",
        "macunha",
        "sprenguiça",
        "hadalar",
        "trame",
        "mio",
        # extremely obscure or loaded period terms
        "pelego",
        "caboclo",
        "patente (de porta)",
        "xifópago",
        "sociodrama",
    ],
    "l": [
        # truly obscure film deep cuts. Kept: enduring classics
        # (Frankenstein, Mandrake, Dick Tracy, Telê Santana,
        # A Ponte do Rio Kwai, Por Quem os Sinos Dobram,
        # Os Canhões de Navarone, Manda-Chuva, etc.).
        "\"Sonhos de uma Noite de Verão\"",
        "\"Se Meu Fusca Falasse\"",
        "\"Irmãos Coragem\"",
        "Irmãos Metralha",
        "\"O Dólar Furado\"",
        "\"encurralado\"",
        "\"Tirando a Casa pra Mãe Joana\"",
        "\"A Família Trapo\"",
        "\"Vestida Para Matar\"",
        "\"Império dos Sentidos\"",
        "\"9 1/2 Semanas de Amor\"",
        "\"As Minas do Rei Salomão\"",
        "\"Nacional Kid\"",
        "\"Boatinha Mas Ordinária\"",  # typo + very obscure
        "\"Os Brutos Também Amam\"",
        "\"Sete Velhos Para Sete Irmãos\"",
        "\"Mad\" (revista)",            # defunct in BR
        # obscure / deceased / very dated personalities
        "Hortênsia",
        "João Bafo-de-Onça",
        "Sivuca",
        "Miéle",
        "Carlos Zéfiro",
        "Geraldão",
        "Peninha",
        "Alain Prost",
        "Nigel Mansell",
        "Mortadelo e Salaminho",
        "Nelson Ned",
        "Arrelia",
        "Boris Karloff",
        "João Saldanha",
        "Juca Chaves",
        "Clarabela e Horácio",
        "Pepe Legal",
        "Bolinha",
        "Saninho",
        "Zé do Boné",
        # fabricated / niche
        "cochechia",
        "beque",  # archaic soccer position term
        "pano",   # ambiguous one-word entry
        "numismática",
        "ikebana",
    ],
    "o": [
        # typos / fabricated only
        "tijoira",       # typo of "tesoura"; "tesoura" added below
        "tapiscira",
        "catchup",       # modern spelling is "ketchup"
        # verbs/adjectives miscategorised as objects
        "valar",
        "esparramar",
        "dedilhar",
        "planar",
        # truly obscure or abstract — NOT removing dated-but-iconic
        # objects (anágua, dial, mimeógrafo, retroprojetor, enceradeira,
        # cristaleira, mata-borrão, pulôver — those stay; they make
        # for great visual prompts).
        "aerófilo",
        "estornudo",     # archaic for "espirro"
        "réstia",
        "zurzido",
        "baforada",
        "timão",         # ambiguous
    ],
    "p": [
        # racially or sexually loaded / period slurs / inappropriate
        "senzala",
        "mulato",
        "pigmeu",
        "jagunço",
        "tarado",
        "ninfomaníaca",
        "corno",
        "racista",
        "travesti",
        "pixaim",
        # fabricated / very obscure
        "cuatinga",
        "bica",
        # period political figures most modern players can't visualise
        "Onassis",
        "Jânio Quadros",
        "Boris Yeltsin",
        "Mikhail Gorbachev",
        "Ronald Reagan",
        "George Bush",
        "François Mitterrand",
        "Richard Nixon",
        "Zélia Cardoso de Mello",
        "Falcão (jogador)",
        "Zerbini",
    ],
    "t": [
        # typos / fabricated only
        "procissião",
        "ruxo",
        "sabicha",
        "barba-rama",
        "invencão",
        # very niche
        "Taça Jules Rimet",
        # cross-category duplicates (kept in their primary category):
        "estetoscópio",  # also in O
        "cinto",         # also in D
        # within-file duplicates handled automatically below.
    ],
}

# ---------- Additions (entry = (word, allPlay?)) ----------
# Each entry: tuple(str, bool).  Flag = 1 marks allPlay.

def E(word: str, allplay: bool = False) -> tuple[str, bool]:
    return (word, allplay)


ADDITIONS: dict[str, list[tuple[str, bool]]] = {
    # ---------- A : Action verbs / multi-word actions ----------
    "a": [
        E("postar", True),
        E("baixar (download)", True),
        E("digitalizar", False),
        E("escanear", True),
        E("fotografar", True),
        E("tirar selfie", True),
        E("gravar vídeo", True),
        E("fazer videochamada", True),
        E("copiar e colar", True),
        E("carregar celular", True),
        E("compartilhar foto", True),
        E("enviar mensagem", True),
        E("chamar Uber", True),
        E("pedir iFood", True),
        E("fazer Pix", True),
        E("usar máscara", True),
        E("vacinar", True),
        E("ouvir podcast", True),
        E("arrastar na tela", False),
        E("ligar o ar-condicionado", True),
        E("mexer no celular", True),
        E("digitar no teclado", True),
        E("comentar", False),
        E("curtir foto", True),
        E("dar match", False),
        E("trocar fralda", True),
        E("passar fio dental", False),
        E("escovar os dentes", True),
        E("colocar a coleira", False),
        E("lavar a louça", True),
    ],

    # ---------- D : Hard / abstract concepts ----------
    "d": [
        E("algoritmo", False),
        E("inteligência artificial", True),
        E("criptografia", False),
        E("nanotecnologia", True),
        E("biotecnologia", True),
        E("realidade virtual", True),
        E("realidade aumentada", True),
        E("sustentabilidade", True),
        E("aquecimento global", True),
        E("desinformação", False),
        E("procrastinação", True),
        E("empreendedorismo", False),
        E("gentrificação", False),
        E("biossegurança", True),
        E("metaverso", False),
        E("blockchain", False),
        E("hacker ético", False),
        E("paradoxo", False),
        E("dilema ético", False),
    ],

    # ---------- L : Lazer / pop culture (modernised) ----------
    "l": [
        # Modern Disney / Pixar
        E("\"Toy Story\"", True),
        E("\"Procurando Nemo\"", True),
        E("\"Os Incríveis\"", True),
        E("\"Up: Altas Aventuras\"", True),
        E("\"Wall-E\"", True),
        E("\"Ratatouille\"", True),
        E("\"Moana\"", True),
        E("\"Encanto\"", True),
        E("\"Divertida Mente\"", True),
        E("\"Coco\"", True),
        E("\"Soul\"", True),
        E("\"Luca\"", True),
        E("\"Carros\"", True),
        E("\"Monstros S.A.\"", True),
        E("\"Zootopia\"", True),
        E("\"Detona Ralph\"", True),
        E("\"Frozen\"", True),
        E("\"Enrolados\"", True),
        E("\"Valente\"", True),
        E("\"A Bela e a Fera\"", True),
        E("\"O Rei Leão\"", True),
        E("\"Aladdin\"", True),
        E("\"Mulan\"", True),
        E("\"Lilo & Stitch\"", True),
        # Marvel / DC
        E("\"Vingadores\"", True),
        E("\"Homem de Ferro\"", True),
        E("\"Pantera Negra\"", True),
        E("\"Capitão América\"", True),
        E("Thor", True),
        E("\"Doutor Estranho\"", True),
        E("\"Coringa\"", True),
        E("\"Mulher-Maravilha\"", True),
        E("Batman", True),
        E("Aquaman", True),
        # Major modern international films
        E("\"Harry Potter\"", True),
        E("\"Star Wars\"", True),
        E("\"Senhor dos Anéis\"", True),
        E("\"Matrix\"", True),
        E("\"Avatar\"", True),
        E("\"Titanic\"", True),
        E("\"Jurassic Park\"", True),
        E("\"Velozes e Furiosos\"", True),
        E("\"Mad Max\"", True),
        E("\"Oppenheimer\"", True),
        E("\"Barbie\"", True),
        E("\"Pulp Fiction\"", True),
        E("\"Forrest Gump\"", True),
        E("\"O Resgate do Soldado Ryan\"", True),
        # Modern Brazilian films
        E("\"Tropa de Elite\"", True),
        E("\"Cidade de Deus\"", True),
        E("\"Central do Brasil\"", True),
        E("\"Auto da Compadecida\"", True),
        E("\"Bacurau\"", True),
        E("\"Que Horas Ela Volta?\"", False),
        E("\"Dois Filhos de Francisco\"", True),
        # Streaming series
        E("\"Stranger Things\"", True),
        E("\"Breaking Bad\"", True),
        E("\"Game of Thrones\"", True),
        E("\"La Casa de Papel\"", True),
        E("\"Round 6\"", True),
        E("\"Friends\"", True),
        E("\"The Office\"", True),
        E("\"Black Mirror\"", True),
        E("\"Wandinha\"", True),
        E("\"Dark\"", False),
        E("\"Lost\"", True),
        E("\"The Big Bang Theory\"", True),
        # Brazilian musicians
        E("Anitta", True),
        E("Ivete Sangalo", True),
        E("Caetano Veloso", True),
        E("Gilberto Gil", True),
        E("Milton Nascimento", True),
        E("Marisa Monte", True),
        E("Maria Bethânia", True),
        E("Djavan", True),
        E("Luan Santana", True),
        E("Marília Mendonça", True),
        E("Pabllo Vittar", True),
        E("Skank", True),
        E("Legião Urbana", True),
        E("Titãs", True),
        E("Paralamas do Sucesso", True),
        E("O Rappa", True),
        E("Capital Inicial", True),
        # International musicians
        E("Beyoncé", True),
        E("Madonna", True),
        E("Lady Gaga", True),
        E("Adele", True),
        E("Taylor Swift", True),
        E("Bruno Mars", True),
        E("Eminem", True),
        E("Coldplay", True),
        E("Queen", True),
        E("Beatles", True),
        E("Rolling Stones", True),
        E("Metallica", True),
        E("Michael Jackson", True),
        E("Iron Maiden", True),
        # Sports
        E("Neymar", True),
        E("Pelé", True),
        E("Marta (jogadora)", True),
        E("Cristiano Ronaldo", True),
        E("Messi", True),
        E("Vinicius Júnior", True),
        E("LeBron James", True),
        E("Michael Jordan", True),
        E("Anderson Silva", True),
        E("Gabriel Medina", True),
        E("Copa do Mundo", True),
        E("Olimpíadas", True),
        # Games
        E("PlayStation", True),
        E("Xbox", True),
        E("Nintendo", True),
        E("Minecraft", True),
        E("Fortnite", True),
        E("Pokémon", True),
        E("Super Mario", True),
        E("The Sims", True),
        E("GTA", True),
        E("Tetris", True),
        E("League of Legends", False),
        # Books / authors (modern Brazilian)
        E("Paulo Coelho", True),
        E("Clarice Lispector", True),
        E("Jorge Amado", True),
        E("Machado de Assis", True),
        # Hobbies
        E("skate", True),
        E("crossfit", False),
        E("pilates", True),
        E("yoga", True),
        E("escalada esportiva", False),
    ],

    # ---------- O : Modern objects ----------
    "o": [
        E("celular", True),
        E("smartphone", True),
        E("tablet", True),
        E("notebook", True),
        E("fone de ouvido", True),
        E("carregador", True),
        E("pendrive", True),
        E("mouse", True),
        E("teclado de computador", True),
        E("monitor de computador", True),
        E("impressora", True),
        E("ar-condicionado", True),
        E("patinete elétrico", True),
        E("carro elétrico", True),
        E("drone", True),
        E("câmera digital", True),
        E("controle remoto", True),
        E("cartão de crédito", True),
        E("óculos escuros", True),
        E("óculos de sol", True),
        E("tesoura", True),
        E("guarda-chuva", True),
        E("mochila", True),
        E("tênis (calçado)", True),
        E("chinelo", True),
        E("escova de dente elétrica", False),
        E("aspirador de pó", True),
        E("ventilador", True),
        E("secador de cabelo", True),
        E("cafeteira", True),
        E("batom", True),
        E("esmalte de unha", True),
        E("desodorante", True),
        E("prancha de surf", True),
        E("rolo de pintura", False),
        E("máscara cirúrgica", True),
        E("garrafinha de água", False),
        E("frigideira antiaderente", False),
        E("balança de cozinha", False),
        E("airfryer", True),
    ],

    # ---------- P : Modern professions, places, animals, figures ----------
    "p": [
        # Modern professions
        E("influenciador digital", True),
        E("youtuber", True),
        E("programador", True),
        E("motoboy", True),
        E("entregador de iFood", True),
        E("motorista de Uber", True),
        E("enfermeira", True),
        E("personal trainer", True),
        E("gamer", True),
        E("cientista de dados", False),
        # Global figures (durable)
        E("Steve Jobs", True),
        E("Elon Musk", True),
        E("Bill Gates", True),
        E("Mark Zuckerberg", False),
        E("Barack Obama", True),
        E("Greta Thunberg", False),
        # Brazilian personalities (modern)
        E("Ayrton Senna", True),
        E("Sabrina Sato", True),
        E("Xuxa Meneghel", True),
        E("Ana Maria Braga", True),
        E("Silvio Santos", True),
        # Iconic places
        E("Cristo Redentor", True),
        E("Pão de Açúcar", True),
        E("Maracanã", True),
        E("Estátua da Liberdade", True),
        E("Torre Eiffel", True),
        E("Big Ben", True),
        E("Muralha da China", True),
        E("Coliseu", True),
        E("Machu Picchu", True),
        E("Disneylândia", True),
        E("Las Vegas", True),
        E("Tóquio", True),
        E("Dubai", True),
    ],

    # ---------- T : Universal modern concepts (always allPlay implicitly) ----------
    "t": [
        E("internet", False),
        E("wi-fi", False),
        E("bluetooth", False),
        E("emoji", False),
        E("selfie", False),
        E("GPS", False),
        E("QR code", False),
        E("código de barras", False),
        E("Pix", False),
        E("streaming", False),
        E("podcast", False),
        E("live", False),
        E("pandemia", False),
        E("álcool em gel", False),
        E("home office", False),
        E("delivery", False),
        E("aplicativo", False),
        E("biometria", False),
        E("impressão digital", False),
        E("nuvem (computação)", False),
        E("redes sociais", False),
        E("Black Friday", False),
        E("carona compartilhada", False),
        E("ônibus", False),
        E("metrô", False),
        E("aeroporto", False),
        E("supermercado", False),
        E("shopping", False),
        E("farmácia", False),
        E("hospital", False),
        E("restaurante", False),
        E("avião", False),
        E("pizza", False),
        E("hambúrguer", False),
        E("sushi", False),
        E("cachorro", False),
        E("gato", False),
        E("Netflix", False),
        E("YouTube", False),
        E("WhatsApp", False),
        E("Spotify", False),
        E("Instagram", False),
        E("TikTok", False),
        E("Uber", False),
        E("iFood", False),
        E("Google", False),
        E("Wikipedia", False),
    ],
}


# ---------- Rewrite logic ----------

def normalize(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.strip()


def rewrite_file(cat: str) -> dict:
    path = ROOT / f"{cat}.json"
    arr = json.loads(path.read_text(encoding="utf-8"))
    remove_set = {r for r in REMOVALS.get(cat, [])}
    # We also dedupe within-file: keep only first occurrence per normalized form.
    kept: list[list] = []
    seen_norm: set[str] = set()
    removed_count = 0
    deduped_count = 0
    for entry in arr:
        word = entry[0]
        n = normalize(word)
        if word in remove_set:
            removed_count += 1
            continue
        if n in seen_norm:
            deduped_count += 1
            continue
        seen_norm.add(n)
        kept.append(entry)

    added_count = 0
    added_entries: list[list] = []
    for word, allplay in ADDITIONS.get(cat, []):
        n = normalize(word)
        if n in seen_norm:
            continue  # already present (idempotent)
        seen_norm.add(n)
        entry = [word, 1] if allplay else [word]
        kept.append(entry)
        added_entries.append(entry)
        added_count += 1

    # Pretty-print: one entry per line, matching original style.
    body_lines = ["["]
    for i, e in enumerate(kept):
        suffix = "," if i < len(kept) - 1 else ""
        body_lines.append(f"  {json.dumps(e, ensure_ascii=False)}{suffix}")
    body_lines.append("]")
    path.write_text("\n".join(body_lines) + "\n", encoding="utf-8")

    return {
        "category": cat.upper(),
        "before": len(arr),
        "after": len(kept),
        "removed": removed_count,
        "deduped": deduped_count,
        "added": added_count,
        "added_entries": added_entries,
    }


def main() -> None:
    print(f"Curating {ROOT}")
    summaries = [rewrite_file(c) for c in CATEGORIES]
    print(f"\n{'cat':<5} {'before':>7} {'after':>7} {'removed':>8} {'deduped':>8} {'added':>6}")
    print("-" * 50)
    total_before = total_after = total_removed = total_deduped = total_added = 0
    for s in summaries:
        print(
            f"{s['category']:<5} {s['before']:>7} {s['after']:>7} "
            f"{s['removed']:>8} {s['deduped']:>8} {s['added']:>6}"
        )
        total_before += s["before"]
        total_after += s["after"]
        total_removed += s["removed"]
        total_deduped += s["deduped"]
        total_added += s["added"]
    print("-" * 50)
    print(
        f"{'tot':<5} {total_before:>7} {total_after:>7} "
        f"{total_removed:>8} {total_deduped:>8} {total_added:>6}"
    )


if __name__ == "__main__":
    main()
