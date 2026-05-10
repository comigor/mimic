// Database of words for Mimic.
// Each entry: { word: string, category: "P" | "O" | "A" | "D" | "L" | "T", allPlay: boolean }
//
// Categories:
//   P = Pessoa, Lugar ou Animal
//   O = Objeto
//   A = Ação
//   D = Difícil
//   L = Lazer
//   T = Todos jogam (sempre allPlay)
//
// allPlay = true means every team plays at the same time
// (T category words OR words marked with * in the source).

window.MIMIC_WORDS = [
  // Placeholder words — will be replaced by the cards in user-provided images.
  { word: "Cachorro",        category: "P", allPlay: false },
  { word: "Pelé",             category: "P", allPlay: false },
  { word: "Geladeira",        category: "O", allPlay: false },
  { word: "Escova de dentes", category: "O", allPlay: false },
  { word: "Correr",           category: "A", allPlay: false },
  { word: "Espirrar",         category: "A", allPlay: false },
  { word: "Saudade",          category: "D", allPlay: false },
  { word: "Filosofia",        category: "D", allPlay: false },
  { word: "Praia",            category: "L", allPlay: false },
  { word: "Carnaval",         category: "L", allPlay: false },
  { word: "Pega-pega",        category: "T", allPlay: true  },
  { word: "Telefone sem fio", category: "T", allPlay: true  },
];
