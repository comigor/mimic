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
//
// Words extracted via OCR from the original cards.
// Please report typos or mis-transcribed entries.

(function () {
  // Compact form: [word, category, allPlay?]
  // allPlay defaults to true when category is "T".
  const RAW = [
    // --- Batch 1 ---
    ["rainha","P"],["veleiro","O"],["falar com a parede","A"],["indignado","D"],["Dustin Hoffman","L"],["grito","T"],
    ["simpático","P"],["panetone","O",1],["pulverizar","A"],["pediatra","D",1],["\"Sonhos de uma Noite de Verão\"","L"],["domingo","T"],
    ["narrador","P"],["trepadeira","O"],["castigar","A"],["rabo-de-saia","D"],["tiro de partida","L"],["vírgula","T"],
    ["crista","P",1],["canoa","O"],["picotar","A"],["imediato","D"],["buraco (jogo)","L"],["luminária","T"],
    ["bicho","P",1],["bobina","O",1],["serrar","A",1],["valor","D",1],["\"Mad\" (revista)","L",1],["bóton","T"],
    ["senzala","P"],["entulho","O"],["cometer suicídio","A"],["vago","D"],["\"Robocop\"","L"],["nazismo","T"],
    ["caranguejo","P"],["guarda-sol","O"],["ajudar","A"],["lacuna","D"],["aplausos","L"],["insulto","T"],
    ["médico","P",1],["discos","O",1],["adoecer","A",1],["atentado ao pudor","D",1],["Manoel Bandeira","L",1],["letra","T"],
    ["vírus","P",1],["camafeu","O",1],["amassar","A",1],["desafogado","D",1],["goleada","L",1],["população","T"],
    ["Isaac Newton","P"],["pingente","O"],["florescer","A"],["magma","D"],["gibi","L"],["bombeiro","T"],
    ["físico (profissão)","P"],["tinteiro","O"],["ninar","A"],["adultério","D"],["tabelar (futebol)","L"],["pêra","T"],
    ["ratazana","P",1],["dicionário","O",1],["desbastar","A",1],["eremita","D",1],["\"Se Meu Fusca Falasse\"","L",1],["névoa","T"],
    ["testemunha","P"],["assoalho","O"],["intercalar","A"],["mortalha","D"],["\"Fantasia\"","L"],["girassol","T"],
    ["osso","P"],["tecido estampado","O"],["poluir","A"],["bacilo","D"],["\"encurralado\"","L"],["radiografia","T"],
    ["mamífero","P"],["pompom","O"],["tirar o escalpo","A"],["sebo","D"],["Irmãos Metralha","L"],["pepino","T"],
    ["contorcionista","P"],["margarina","O"],["redigir","A"],["carrasco","D"],["pit stop","L"],["furacão","T"],
    ["nádega","P",1],["sutiã","O",1],["apresentar","A",1],["autopsia","D",1],["\"O Dólar Furado\"","L",1],["alarme de carro","T"],
    ["criança","P"],["brigadeiro (doce)","O"],["sacudir","A"],["inocente","D"],["futebol de botão","L"],["lancha","T"],
    ["padre","P"],["carrinho de feira","O"],["escorregar","A"],["psicologia","D"],["\"Irmãos Coragem\"","L"],["semana","T"],
    ["anão","P"],["trabuco","O"],["brincar","A"],["bucha","D"],["Hortênsia","L"],["perspectiva","T"],
    ["sofá","P"],["catchup","O"],["acertar no alvo","A"],["primavera","D"],["\"Perdidos no Espaço\"","L"],["foto","T"],
    ["fugitivo","P"],["suporte de plantas","O"],["movimentar","A"],["noturno","D"],["play-ground","L"],["tapa","T"],
    ["garçom","P"],["orelha de livro","O"],["nascer","A"],["correção monetária","D"],["bater figurinha","L"],["relâmpago","T"],
    ["arrepio","P",1],["chá","O",1],["ter um caso","A",1],["patente (de porta)","D",1],["Chico Buarque","L",1],["tangente","T"],
    ["manhosa","P",1],["faca elétrica","O",1],["apanhar","A",1],["saudável","D",1],["\"O Barbeiro de Sevilha\"","L",1],["cócegas","T"],
    ["barata","P"],["mesa de bilhar","O"],["pagar","A"],["diagnóstico","D"],["amarelinha","L",1],["labareda","T"],
    ["México","P"],["minissaia","O"],["acompanhar","A"],["botão de emergência","D",1],["carambola","L"],["laranja","T"],
    ["Salvador","P",1],["filtro","O"],["chorar","A",1],["harmonia","D"],["Colombina","L",1],["itinerário","T"],
    ["tímpano","P"],["amuleto","O"],["abrir a porta","A"],["válvula","D"],["show","L",1],["peso","T"],
    ["Júlio César","P",1],["motocicleta","O",1],["atracar","A",1],["quarentena","D",1],["cara-ou-coroa","L",1],["elétron","T"],
    ["Leonardo da Vinci","P"],["pavio","O"],["emergir","A"],["valente","D"],["Magic Johnson","L"],["relinchar","T"],
    ["mulato","P",1],["walk machine","O",1],["fazer as pazes","A",1],["larva","D",1],["zape","L",1],["cartaz","T"],
    ["corvo","P"],["sacola de feira","O"],["amamentar","A"],["gula","D"],["\"As 7 Vampiras\"","L"],["juros","T"],
    ["Fernando Collor de Mello","P"],["papel picado","O"],["examinar","A"],["alienação","D"],["Gal Costa","L"],["Corão","T"],
    ["topete","P",1],["poltrona","O",1],["desmatar","A",1],["pterodáctilo","D",1],["Mozart","L",1],["caqui","T"],
    ["enxame de abelhas","P"],["porta-malas","O"],["marcar","A"],["ocioso","D"],["\"O Homem Elefante\"","L"],["guaraná","T"],
    ["feminino","P"],["sino","O"],["cancelar","A"],["jóquei","D"],["fã-clube","L"],["velório","T"],
    ["Santos Dumont","P"],["medalha","O"],["atirar","A"],["vingamento","D"],["\"Janela Indiscreta\"","L"],["tom","T"],
    ["idade","P",1],["corneta","O",1],["descarçar","A",1],["fio de bigode","D",1],["churrasco","L",1],["casca","T"],
    ["lanterninha","P",1],["placa de proibido estacionar","O",1],["coleatar","A",1],["estrabismo","D",1],["medalha de ouro","L",1],["esquadro","T"],
    ["calvo","P"],["gaiola","O"],["coar","A"],["maremoto","D"],["cama-de-gato","L"],["amortecedor (de automóvel)","T"],
    ["gueixa","P"],["anágua","O"],["cerrar as pálpebras","A"],["algemas","D"],["desenho animado","L"],["pastel","T"],
    ["tarado","P"],["xarope","O"],["trair","A"],["fanático","D"],["ator","L"],["escafandro","T"],
    ["pesada","P"],["espectro de luz","O"],["estudar","A"],["haste","D"],["Capitão Gancho","L"],["parto","T"],
    ["empregada","P",1],["panela de pressão","O",1],["amamentar","A",1],["galanteador","D",1],["Mafalda","L",1],["programa","T"],
    ["litoral","P"],["limpador de pára-brisas","O"],["andar a cavalo","A"],["legítimo","D"],["\"Pink Floyd\"","L",1],["hepatite","T"],
    ["leve","P",1],["tonel","O"],["fazer a barba","A",1],["simpatia","D"],["Telê Santana","L",1],["parábola","T"],
    ["Palácio do Planalto","P",1],["bisturi","O",1],["acorrentar","A",1],["chantagem","D",1],["Ney Matogrosso","L",1],["cerveja","T"],
    ["pica-pau","P"],["terço","O"],["sufritar","A"],["gabinete","D"],["João Bafo-de-Onça","L"],["interfone","T"],
    ["normal","P",1],["micro-ônibus","O",1],["demarcar","A",1],["haxixe","D",1],["partitura","L",1],["velocidade","T"],
    ["estatura","P"],["canudo","O"],["despir","A"],["repressão","D"],["teatro de fantoches","L"],["casaco","T"],
    ["floresta","P"],["crucifixo","O"],["deslocar","A"],["consórcio","D"],["\"Missão Impossível\"","L"],["chácara","T"],
    ["sábio","P",1],["bibelô","O"],["bloquear","A",1],["plantão","D"],["pião","L",1],["sanduíche","T"],
    ["mergulhador","P"],["lenço","O"],["guiar um cego","A"],["enchimento","D"],["Palmeiras","L"],["rebote","T"],
    ["Maquiavel","P",1],["galho","O",1],["aderir","A",1],["incerteza","D",1],["Sivuca","L",1],["redação","T"],
    ["albino","P"],["carta de amor","O",1],["depilar","A"],["caboclo","D"],["Zico","L"],["neon","T"],
    ["cheiroso","P"],["trava","O"],["desarmar","A"],["garupa","D"],["numismática","L"],["Concorde (avião)","T"],
    ["orfanato","P"],["aspirina","O"],["estender roupa","A"],["vértice","D"],["diretor de cinema","L"],["par","T"],
    ["mundo","P"],["apagador","O"],["lascar","A"],["fechar a 7 chaves","D"],["\"Corrida Maluca\"","L"],["papiro","T"],
    ["George Bush","P",1],["jaula","O",1],["preparar","A",1],["indexar","D",1],["\"Crocodilo Dundee\"","L",1],["caçamba","T"],
    ["Argentina","P"],["chicote","O"],["cumprimentar","A"],["natimorto","D"],["\"Led Zeppelin\"","L"],["missa","T"],
    ["xereta","P"],["torta de morango","O"],["derrubar","A"],["calo","D"],["\"Os Pássaros\"","L"],["corado","T"],
    ["esponja-do-mar","P"],["balança de farmácia","O"],["abastecer","A"],["papa-defuntos","D"],["Gugu Liberato","L"],["ouro","T"],
    ["inferno","P"],["bomba de gasolina","O"],["dar a volta ao mundo","A"],["atmosfera","D"],["ritmo","L"],["sexo","T"],
    ["mula","P",1],["ovo estalado","O",1],["fazer as malas","A",1],["conversão","D",1],["trenzinho elétrico","L",1],["ziguezague","T"],
    ["canguru","P"],["atadura","O"],["obturar","A",1],["gastronomia","D",1],["maestro","L"],["passe","T"],
    ["nobre","P"],["táxi","O"],["enfeitar","A"],["laser","D"],["par de damas","L"],["produção","T"],
    ["Tietê (rio)","P"],["leme","O"],["torturar","A"],["alimentar","D"],["Carmen Miranda","L"],["lua crescente","T"],
    ["faminto","P"],["porta-retrato","O"],["zeloso","A"],["\"Oktoberfest\"","D"],["turbina","T"],
    ["detetive","P",1],["gatinho","O",1],["arborizar","A",1],["beija-flor","D",1],["Senha (jogo)","L",1],["grama","T"],
    ["leão","P"],["ferro de passar","O"],["triturar","A"],["gaúcho","D"],["bandeirinha","L"],["meteorologia","T"],
    ["fonte","P"],["gargantilha","O"],["fechar","A"],["sinceridade","D"],["Chitãozinho e Xororó","L"],["página","T"],
    ["ganso","P"],["caixa de fósforos","O"],["tosar","A"],["busca","D"],["Miéle","L"],["salina","T"],
    ["playground","P"],["biombo","O"],["brotar","A"],["turma","D"],["Bob Marley","L"],["político","T"],
    ["Zerbini","P",1],["planetário","O",1],["calibrar pneus","A",1],["vacilar","D",1],["Dick Tracy","L",1],["plataforma","T"],
  ];

  const seen = new Set();
  const out = [];
  for (const entry of RAW) {
    const word = entry[0];
    const category = entry[1];
    if (!word || word.trim() === "") continue;
    const allPlay = category === "T" ? true : Boolean(entry[2]);
    const key = word.toLowerCase() + "|" + category;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ word: word, category: category, allPlay: allPlay });
  }
  window.MIMIC_WORDS = out;
})();
