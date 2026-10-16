// Banco de moléculas do jogo. f = fórmula, nome = português, en = nome em inglês para a PubChem,
// regra = [teste da estrutura, dica quando falha] para separar isômeros (mesma fórmula, estrutura diferente).
// Cada fórmula foi conferida contra a PubChem (mesma contagem de átomos que o nome em inglês).

export const VALENCIA = { H: 1, C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1 };

// ===== REGRAS DE ESTRUTURA =====
const viz = (at, lig, i) => lig.flatMap(l => l.a === i ? [[l.b, l.ordem]] : l.b === i ? [[l.a, l.ordem]] : []);
const nViz = (at, lig, i, el) => viz(at, lig, i).filter(([j]) => at[j].el === el).length;
const temOH = (at, lig) => at.some((a, i) => a.el === 'O' && nViz(at, lig, i, 'H') === 1);
const semOH = (at, lig) => !temOH(at, lig);
// OH preso a um carbono que tem n vizinhos carbono (1 = primário, 2 = secundário, 3 = terciário)
const ohEm = n => (at, lig) => at.some((a, i) => a.el === 'O' && nViz(at, lig, i, 'H') === 1 &&
    viz(at, lig, i).some(([j]) => at[j].el === 'C' && nViz(at, lig, j, 'C') === n));
// C=O + O–H no mesmo carbono
const cooh = (at, lig) => at.some((a, i) => a.el === 'C' &&
    viz(at, lig, i).some(([j, o]) => at[j].el === 'O' && o === 2) &&
    viz(at, lig, i).some(([j, o]) => at[j].el === 'O' && o === 1 && nViz(at, lig, j, 'H') === 1));
// C=O num carbono com n vizinhos carbono (2 = cetona, ≤1 com H = aldeído)
const cetona = (at, lig) => at.some((a, i) => a.el === 'C' && nViz(at, lig, i, 'C') === 2 &&
    viz(at, lig, i).some(([j, o]) => at[j].el === 'O' && o === 2));
const aldeido = (at, lig) => at.some((a, i) => a.el === 'C' && nViz(at, lig, i, 'H') >= 1 &&
    viz(at, lig, i).some(([j, o]) => at[j].el === 'O' && o === 2));
const maxC = (at, lig) => Math.max(0, ...at.map((a, i) => a.el === 'C' ? nViz(at, lig, i, 'C') : 0));
const linear = (at, lig) => maxC(at, lig) <= 2;
const ramificado = (at, lig) => maxC(at, lig) === 3;
const quaternario = (at, lig) => maxC(at, lig) === 4;
const e = (...fs) => (at, lig) => fs.every(f => f(at, lig));

const OH = d => [temOH, d || 'Esta molécula tem o grupo O–H.'];
const ACIDO = [cooh, 'Ácido carboxílico: um carbono com C=O e O–H (grupo COOH).'];
const AMINO = [cooh, 'Aminoácido: tem o grupo amina (N) e o grupo COOH.'];
const m = (f, nome, en, regra) => ({ f, nome, en, regra });

export const BLOCOS = [
    { nome: 'Inorgânicos', icone: 'droplet', mols: [
        m('H2O', 'Água', 'water'), m('H2', 'Gás hidrogênio', 'hydrogen'), m('HCl', 'Ácido clorídrico', 'hydrogen chloride'),
        m('O2', 'Gás oxigênio', 'oxygen'), m('NH3', 'Amônia', 'ammonia'), m('N2', 'Gás nitrogênio', 'nitrogen'),
        m('CO2', 'Gás carbônico', 'carbon dioxide'), m('Cl2', 'Gás cloro', 'chlorine'), m('F2', 'Gás flúor', 'fluorine'),
        m('Br2', 'Bromo', 'bromine'), m('I2', 'Iodo', 'iodine'), m('HF', 'Ácido fluorídrico', 'hydrogen fluoride'),
        m('HBr', 'Ácido bromídrico', 'hydrogen bromide'), m('HI', 'Ácido iodídrico', 'hydrogen iodide'),
        m('H2S', 'Sulfeto de hidrogênio', 'hydrogen sulfide'), m('HCN', 'Ácido cianídrico', 'hydrogen cyanide'),
        m('H2O2', 'Água oxigenada', 'hydrogen peroxide'), m('N2H4', 'Hidrazina', 'hydrazine'),
        m('NH2OH', 'Hidroxilamina', 'hydroxylamine'), m('HClO', 'Ácido hipocloroso', 'hypochlorous acid'),
        m('Cl2O', 'Monóxido de dicloro', 'dichlorine monoxide'), m('OF2', 'Difluoreto de oxigênio', 'oxygen difluoride'),
        m('NF3', 'Trifluoreto de nitrogênio', 'nitrogen trifluoride'), m('NCl3', 'Tricloreto de nitrogênio', 'nitrogen trichloride'),
        m('ClF', 'Monofluoreto de cloro', 'chlorine monofluoride'), m('BrCl', 'Cloreto de bromo', 'bromine chloride'),
        m('ICl', 'Monocloreto de iodo', 'iodine monochloride'), m('SCl2', 'Dicloreto de enxofre', 'sulfur dichloride'),
        m('CS2', 'Dissulfeto de carbono', 'carbon disulfide'), m('COS', 'Sulfeto de carbonila', 'carbonyl sulfide'),
        m('HNCO', 'Ácido isociânico', 'isocyanic acid'), m('ClCN', 'Cloreto de cianogênio', 'cyanogen chloride'),
        m('C2N2', 'Cianogênio', 'cyanogen'), m('HNO2', 'Ácido nitroso', 'nitrous acid'),
        m('COCl2', 'Fosgênio', 'phosgene'), m('N2F2', 'Difluoreto de dinitrogênio', 'difluorodiazene'),
        m('H2S2', 'Dissulfeto de hidrogênio', 'hydrogen disulfide'), m('S2Cl2', 'Monocloreto de enxofre', 'disulfur dichloride') ] },
    { nome: 'Hidrocarbonetos e haletos', icone: 'flame', mols: [
        m('CH4', 'Metano', 'methane'), m('C2H6', 'Etano', 'ethane'), m('C2H4', 'Eteno', 'ethylene'),
        m('C2H2', 'Etino (acetileno)', 'acetylene'), m('C3H8', 'Propano', 'propane'),
        m('C3H6', 'Propeno', 'propene', [e(linear, (at, lig) => lig.some(l => l.ordem === 2)), 'O propeno tem uma ligação dupla C=C (não é um anel).']),
        m('C3H4', 'Propino', 'propyne', [(at, lig) => lig.some(l => l.ordem === 3), 'O propino tem uma ligação tripla C≡C.']),
        m('C4H10', 'Butano', 'butane', [linear, 'O butano é uma cadeia reta, sem ramificação.']),
        m('C5H12', 'Pentano', 'pentane', [linear, 'O pentano é uma cadeia reta, sem ramificação.']),
        m('C6H14', 'Hexano', 'hexane', [linear, 'O hexano é uma cadeia reta, sem ramificação.']),
        m('C4H6', '1,3-Butadieno', '1,3-butadiene', [(at, lig) => lig.filter(l => l.ordem === 2).length === 2, 'O butadieno tem duas ligações duplas.']),
        m('C6H6', 'Benzeno', 'benzene', [(at, lig) => lig.filter(l => l.ordem === 2).length === 3, 'O benzeno é um anel de 6 carbonos com 3 ligações duplas alternadas.']),
        m('C5H10', 'Ciclopentano', 'cyclopentane', [(at, lig) => !lig.some(l => l.ordem > 1), 'O ciclopentano é um anel só com ligações simples.']),
        m('C6H12', 'Ciclo-hexano', 'cyclohexane', [(at, lig) => !lig.some(l => l.ordem > 1), 'O ciclo-hexano é um anel só com ligações simples.']),
        m('C7H8', 'Tolueno', 'toluene'),
        m('CH3Cl', 'Clorometano', 'chloromethane'), m('CH2Cl2', 'Diclorometano', 'dichloromethane'),
        m('CHCl3', 'Clorofórmio', 'chloroform'), m('CCl4', 'Tetracloreto de carbono', 'carbon tetrachloride'),
        m('CH3F', 'Fluorometano', 'fluoromethane'), m('CH3Br', 'Bromometano', 'bromomethane'), m('CH3I', 'Iodometano', 'iodomethane'),
        m('CF4', 'Tetrafluorometano', 'tetrafluoromethane'), m('CHF3', 'Fluorofórmio', 'fluoroform'),
        m('CCl2F2', 'Freon-12', 'dichlorodifluoromethane'), m('C2H5Cl', 'Cloroetano', 'chloroethane'),
        m('C2H5Br', 'Bromoetano', 'bromoethane'), m('C2H3Cl', 'Cloreto de vinila', 'vinyl chloride'),
        m('C2F4', 'Tetrafluoroeteno', 'tetrafluoroethylene'), m('C2Cl4', 'Tetracloroeteno', 'tetrachloroethylene'),
        m('C2HCl3', 'Tricloroeteno', 'trichloroethylene'), m('CHBr3', 'Bromofórmio', 'bromoform'),
        m('C4H10', 'Isobutano', 'isobutane', [ramificado, 'O isobutano tem um carbono ligado a 3 carbonos.']),
        m('C5H12', 'Isopentano', 'isopentane', [ramificado, 'O isopentano tem um carbono ligado a 3 carbonos.']),
        m('C5H12', 'Neopentano', 'neopentane', [quaternario, 'O neopentano tem um carbono ligado a 4 carbonos.']) ] },
    { nome: 'Álcoois', icone: 'wine', mols: [
        m('CH4O', 'Metanol', 'methanol', OH()),
        m('C2H6O', 'Etanol', 'ethanol', OH('Isso é o éter dimetílico! O etanol tem o grupo O–H.')),
        m('C3H8O', '1-Propanol', '1-propanol', [ohEm(1), 'No 1-propanol o O–H fica no carbono da ponta.']),
        m('C3H8O', '2-Propanol (isopropanol)', 'isopropanol', [ohEm(2), 'No isopropanol o O–H fica no carbono do meio.']),
        m('C4H10O', '1-Butanol', '1-butanol', [e(ohEm(1), linear), 'No 1-butanol a cadeia é reta e o O–H fica na ponta.']),
        m('C4H10O', '2-Butanol', '2-butanol', [e(ohEm(2), linear), 'No 2-butanol a cadeia é reta e o O–H fica no 2º carbono.']),
        m('C4H10O', 'terc-Butanol', 'tert-butanol', [ohEm(3), 'No terc-butanol o O–H fica num carbono ligado a 3 carbonos.']),
        m('C4H10O', 'Isobutanol', 'isobutanol', [e(ohEm(1), ramificado), 'No isobutanol a cadeia é ramificada e o O–H fica na ponta.']),
        m('C5H12O', '1-Pentanol', '1-pentanol', [e(ohEm(1), linear), 'No 1-pentanol a cadeia é reta e o O–H fica na ponta.']),
        m('C2H6O2', 'Etilenoglicol', 'ethylene glycol', OH('O etilenoglicol tem dois grupos O–H.')),
        m('C3H8O3', 'Glicerol', 'glycerol', OH('O glicerol tem três grupos O–H.')),
        m('C3H6O', 'Álcool alílico', 'allyl alcohol', OH('O álcool alílico tem C=C e um O–H.')),
        m('C3H4O', 'Álcool propargílico', 'propargyl alcohol', OH('O álcool propargílico tem C≡C e um O–H.')),
        m('C6H6O', 'Fenol', 'phenol', OH('O fenol é um anel benzênico com O–H.')),
        m('C7H8O', 'Álcool benzílico', 'benzyl alcohol', OH('O álcool benzílico tem um CH₂–OH preso ao anel.')),
        m('C6H12O', 'Ciclo-hexanol', 'cyclohexanol', OH('O ciclo-hexanol é um anel com O–H.')),
        m('C2H5ClO', '2-Cloroetanol', '2-chloroethanol', OH()),
        m('C2H3F3O', 'Trifluoroetanol', '2,2,2-trifluoroethanol', OH()),
        m('C3H8O2', '1,2-Propanodiol', 'propylene glycol', OH('O propilenoglicol tem dois grupos O–H.')) ] },
    { nome: 'Ácidos', icone: 'test-tube', mols: [
        m('CH2O2', 'Ácido fórmico', 'formic acid', ACIDO), m('C2H4O2', 'Ácido acético', 'acetic acid', ACIDO),
        m('CH2O3', 'Ácido carbônico', 'carbonic acid', OH('O ácido carbônico tem dois O–H e um C=O.')),
        m('C3H6O2', 'Ácido propanoico', 'propionic acid', ACIDO), m('C4H8O2', 'Ácido butanoico', 'butyric acid', [e(cooh, linear), 'Ácido butanoico: cadeia reta com COOH na ponta.']),
        m('C5H10O2', 'Ácido pentanoico', 'valeric acid', [e(cooh, linear), 'Ácido pentanoico: cadeia reta com COOH na ponta.']),
        m('C2H2O4', 'Ácido oxálico', 'oxalic acid', ACIDO), m('C3H4O4', 'Ácido malônico', 'malonic acid', ACIDO),
        m('C4H6O4', 'Ácido succínico', 'succinic acid', ACIDO), m('C4H4O4', 'Ácido fumárico', 'fumaric acid', ACIDO),
        m('C3H6O3', 'Ácido lático', 'lactic acid', ACIDO), m('C2H4O3', 'Ácido glicólico', 'glycolic acid', ACIDO),
        m('C3H4O2', 'Ácido acrílico', 'acrylic acid', ACIDO), m('C3H4O3', 'Ácido pirúvico', 'pyruvic acid', ACIDO),
        m('C7H6O2', 'Ácido benzoico', 'benzoic acid', ACIDO), m('C2H3ClO2', 'Ácido cloroacético', 'chloroacetic acid', ACIDO),
        m('C2HCl3O2', 'Ácido tricloroacético', 'trichloroacetic acid', ACIDO),
        m('C2HF3O2', 'Ácido trifluoroacético', 'trifluoroacetic acid', ACIDO),
        m('C7H6O3', 'Ácido salicílico', 'salicylic acid', ACIDO), m('C6H8O7', 'Ácido cítrico', 'citric acid', ACIDO),
        m('C4H6O5', 'Ácido málico', 'malic acid', ACIDO), m('C5H8O4', 'Ácido glutárico', 'glutaric acid', ACIDO) ] },
    { nome: 'Aminoácidos', icone: 'dna', mols: [
        m('C2H5NO2', 'Glicina', 'glycine', AMINO), m('C3H7NO2', 'Alanina', 'alanine', AMINO),
        m('C3H7NO3', 'Serina', 'serine', AMINO), m('C3H7NO2S', 'Cisteína', 'cysteine', AMINO),
        m('C5H11NO2', 'Valina', 'valine', AMINO), m('C6H13NO2', 'Leucina', 'leucine', AMINO),
        m('C4H9NO3', 'Treonina', 'threonine', AMINO), m('C4H7NO4', 'Ácido aspártico', 'aspartic acid', AMINO),
        m('C4H8N2O3', 'Asparagina', 'asparagine', AMINO), m('C5H9NO4', 'Ácido glutâmico', 'glutamic acid', AMINO),
        m('C5H10N2O3', 'Glutamina', 'glutamine', AMINO), m('C5H11NO2S', 'Metionina', 'methionine', AMINO),
        m('C5H9NO2', 'Prolina', 'proline', AMINO), m('C9H11NO2', 'Fenilalanina', 'phenylalanine', AMINO) ] },
    { nome: 'Outras funções orgânicas', icone: 'flask-conical', mols: [
        m('CH2O', 'Formaldeído', 'formaldehyde'), m('C2H4O', 'Acetaldeído', 'acetaldehyde', [aldeido, 'O acetaldeído tem C=O na ponta da cadeia (aldeído).']),
        m('C3H6O', 'Acetona', 'acetone', [cetona, 'Na acetona o C=O fica no carbono do meio.']),
        m('C3H6O', 'Propanal', 'propanal', [e(aldeido, semOH, linear), 'No propanal o C=O fica na ponta da cadeia.']),
        m('C2H6O', 'Éter dimetílico', 'dimethyl ether', [semOH, 'No éter o O fica entre dois carbonos, sem O–H.']),
        m('C4H8O2', 'Acetato de etila', 'ethyl acetate', [semOH, 'O acetato de etila é um éster: não tem O–H.']),
        m('C2H4O2', 'Formiato de metila', 'methyl formate', [semOH, 'O formiato de metila é um éster: não tem O–H.']),
        m('C3H6O2', 'Acetato de metila', 'methyl acetate', [semOH, 'O acetato de metila é um éster: não tem O–H.']),
        m('CH3NH2', 'Metilamina', 'methylamine'), m('CH3SH', 'Metanotiol', 'methanethiol') ] },
];

// o que cada bloco aceita (c = contagem de átomos); o autoteste do jogo.js barra molécula no bloco errado
const so = (c, els) => Object.keys(c).every(el => els.includes(el));
export const ACEITA = [
    (c, f) => !(c.C && c.H) || ['HCN', 'HNCO'].includes(f),
    c => c.C && so(c, ['C', 'H', 'F', 'Cl', 'Br', 'I']),
    (c, f, m) => c.C && c.O && m.regra, // todo álcool tem regra de O–H
    c => c.C && c.O >= 2,
    c => c.C && c.N && c.O >= 2,
    c => c.C && (c.O || c.N || c.S),
];
