#!/usr/bin/env python3
import re, json, gzip, base64, hashlib, pathlib, unicodedata
ROOT=pathlib.Path(__file__).resolve().parent
DEBT=ROOT/'RASTRO-COVERAGE-DEBT-9.0.8.md'

def slug(s):
    s=unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')

def rotate(options, correct, seed):
    opts=[correct]+[x for x in options if x!=correct]
    shift=int(hashlib.sha1(seed.encode()).hexdigest()[:2],16)%len(opts)
    opts=opts[shift:]+opts[:shift]
    return opts,opts.index(correct)

def qdata(prompt, correct, distractors, explanation, hint, qtype='aplicação', difficulty='médio', solution=None, calc=False):
    return dict(prompt=prompt, correct=correct, distractors=distractors, explanation=explanation, hint=hint, qtype=qtype, difficulty=difficulty, solution=solution or [], calc=calc)

def math_q(g, area, sk):
    # Cada caso usa contexto e mecanismo diferentes dos moldes antigos. Valores variam por série.
    if sk=='Sistemas de equações':
        if g==7:
            return qdata('Em uma cantina, 2 sucos e 1 sanduíche custam R$ 19, enquanto 1 suco e 2 sanduíches custam R$ 23. Se s é o preço do suco e a o preço do sanduíche, qual par resolve as duas condições ao mesmo tempo?',
                         '(R$ 5, R$ 9)', ['(R$ 4, R$ 11)','(R$ 6, R$ 7)','(R$ 7, R$ 5)'],
                         'O sistema é 2s+a=19 e s+2a=23. Subtraindo relações ou substituindo, obtém-se a=9 e s=5; o par precisa satisfazer as duas equações, não apenas uma.',
                         'Transforme cada frase em uma equação e teste o par nas duas.', solution=['2s+a=19','s+2a=23','Resolva o sistema e confira nas duas equações.'])
        return qdata('Duas retas são descritas por y=2x+1 e y=-x+7. O ponto de interseção representa a solução do sistema. Qual é esse ponto?',
                     '(2, 5)', ['(1, 3)','(3, 4)','(2, 3)'],
                     'No ponto comum, as expressões de y são iguais: 2x+1=-x+7, então 3x=6 e x=2. Substituindo, y=5.',
                     'Iguale as duas expressões de y.', solution=['2x+1=-x+7','3x=6','x=2 e y=5.'])
    if sk=='Geometria plana':
        vals={7:(8,5),8:(12,7),9:(15,8)}; a,b=vals.get(g,(10,6))
        return qdata(f'Um jardim retangular mede {a} m por {b} m. Será colocada uma faixa de grama apenas ao longo de todo o contorno. Qual medida determina o comprimento total dessa faixa?',
                     f'{2*(a+b)} m', [f'{a*b} m',f'{a+b} m',f'{2*a+b} m'],
                     f'Como a faixa percorre o contorno, calcula-se o perímetro: 2·({a}+{b})={2*(a+b)} m. Área mediria superfície, não comprimento de borda.',
                     'A pergunta fala do contorno, portanto pense em perímetro.', solution=[f'P=2(a+b)=2({a}+{b})={2*(a+b)}.'])
    if sk=='Frações e decimais':
        if g==7:
            return qdata('Uma receita usa 0,75 L de leite. Essa quantidade corresponde a qual fração irredutível de 1 litro?', '3/4', ['7/10','75/10','4/3'], '0,75=75/100. Simplificando numerador e denominador por 25, obtemos 3/4.', 'Escreva o decimal sobre uma potência de 10 e simplifique.', solution=['0,75=75/100','75/100=3/4.'])
        return qdata('Um reservatório estava com 5/8 da capacidade e recebeu mais 0,125 da capacidade total. Que fração da capacidade ficou ocupada?', '3/4', ['5/8','7/8','1/2'], '0,125=1/8. Logo, 5/8+1/8=6/8=3/4.', 'Converta o decimal em fração antes de somar.', solution=['0,125=1/8','5/8+1/8=6/8=3/4.'])
    if sk=='Potenciação e radiciação':
        if g==7:
            return qdata('Um quadrado possui área de 196 cm². Qual é a medida de seu lado?', '14 cm', ['12 cm','28 cm','98 cm'], 'Se l²=196, então l=√196=14. Como medida de lado é positiva, usamos a raiz positiva.', 'A área do quadrado é lado².', solution=['l²=196','l=√196=14.'])
        if g==8:
            return qdata('Qual expressão tem exatamente o mesmo valor que 2³·2⁴?', '2⁷', ['4⁷','2¹²','2¹'], 'Na multiplicação de potências de mesma base, somam-se os expoentes: 2³·2⁴=2^(3+4)=2⁷.', 'As bases são iguais; observe o que acontece com os expoentes.', solution=['2³·2⁴=2^(3+4)=2⁷.'])
        return qdata('Sem calculadora, simplifique √72 usando um quadrado perfeito como fator.', '6√2', ['8√2','3√8','36√2'], '72=36·2. Assim, √72=√36·√2=6√2.', 'Procure o maior quadrado perfeito que divide 72.', solution=['72=36·2','√72=6√2.'])
    if sk=='Porcentagem':
        if g==7:
            return qdata('Uma camiseta de R$ 80 recebeu desconto de 15%. Qual é o preço depois do desconto?', 'R$ 68', ['R$ 65','R$ 72','R$ 92'], '15% de 80 é 0,15·80=12. Como é desconto, 80-12=68.', 'Calcule primeiro o valor do desconto e depois subtraia.', solution=['0,15·80=12','80-12=68.'])
        return qdata('Um produto custava R$ 250 e passou a custar R$ 290. Qual foi o aumento percentual em relação ao preço original?', '16%', ['14%','40%','116%'], 'O aumento foi 40. A taxa é 40/250=0,16=16%. O denominador deve ser o preço original.', 'Compare a variação com o valor inicial.', solution=['290-250=40','40/250=0,16=16%.'])
    if sk=='Razão e proporção':
        if g==8:
            return qdata('Uma tinta é preparada na razão 2 partes de pigmento para 5 partes de base. Se forem usados 20 mL de pigmento mantendo a proporção, quantos mL de base são necessários?', '50 mL', ['40 mL','25 mL','70 mL'], 'De 2 para 20 o fator é 10; a base também deve ser multiplicada por 10: 5·10=50 mL.', 'Mantenha o mesmo fator nas duas grandezas.', solution=['20/2=10','5·10=50.'])
        return qdata('Em uma maquete, 3 cm representam 12 m reais. Mantendo a mesma razão, 7,5 cm representam quantos metros?', '30 m', ['22,5 m','27 m','90 m'], '12/3=4 m por centímetro. Então 7,5·4=30 m.', 'Descubra primeiro quanto 1 cm representa.', solution=['12/3=4','7,5·4=30.'])
    if sk=='Expressões algébricas':
        return qdata('Simplifique 3(2x-1)-2(x+4).', '4x-11', ['4x+5','8x-11','4x-5'], 'Distribuindo: 6x-3-2x-8. Somando termos semelhantes: 4x-11.', 'Aplique a distributiva antes de juntar termos semelhantes.', solution=['3(2x-1)=6x-3','-2(x+4)=-2x-8','6x-3-2x-8=4x-11.'])
    if sk=='Função afim':
        if g==9:
            return qdata('Uma corrida de aplicativo cobra R$ 6 de taxa fixa mais R$ 2 por quilômetro. Se x é a distância em quilômetros, qual função representa o preço P?', 'P(x)=2x+6', ['P(x)=6x+2','P(x)=2x','P(x)=8x'], 'A parte variável é 2x e a taxa fixa é 6; por isso P(x)=2x+6.', 'Separe a parcela fixa da parcela que depende de x.', solution=['variável: 2x','fixa: 6','P(x)=2x+6.'])
        return qdata('Uma função afim passa pelos pontos (0, -3) e (4, 5). Qual é sua lei?', 'f(x)=2x-3', ['f(x)=x-3','f(x)=2x+3','f(x)=8x-3'], 'O coeficiente angular é (5-(-3))/(4-0)=8/4=2. Como f(0)=-3, o termo independente é -3.', 'Use a variação de y dividida pela variação de x e depois o valor em x=0.', solution=['a=(5+3)/4=2','b=-3','f(x)=2x-3.'])
    if sk=='Volume e geometria espacial':
        if g==7:
            return qdata('Uma caixa retangular mede 6 cm de comprimento, 4 cm de largura e 3 cm de altura. Qual é seu volume?', '72 cm³', ['13 cm³','24 cm³','144 cm³'], 'Para um paralelepípedo, V=comprimento·larga·altura=6·4·3=72 cm³.', 'Volume de uma caixa retangular é o produto das três dimensões.', solution=['V=6·4·3=72 cm³.'])
        return qdata('Um aquário em forma de paralelepípedo tem base de 40 cm por 25 cm e altura de 30 cm. Qual volume interno ele possui?', '30 000 cm³', ['3 000 cm³','95 cm³','120 000 cm³'], 'V=40·25·30=30 000 cm³. Somar dimensões não calcula volume.', 'Multiplique área da base pela altura.', solution=['Ab=40·25=1000','V=1000·30=30000 cm³.'])
    if sk=='Estatística':
        if g==7:
            return qdata('As quantidades de livros lidos por cinco estudantes foram 1, 2, 2, 4 e 11. Qual medida representa o valor central sem ser tão afetada pelo 11?', 'Mediana = 2', ['Média = 4','Moda = 11','Amplitude = 2'], 'A mediana é o valor central da lista ordenada e resiste mais ao valor extremo 11. O terceiro valor é 2.', 'Quando existe um valor extremo, compare média e mediana.', solution=['Lista ordenada: 1,2,2,4,11','Valor central=2.'])
        if g==9:
            return qdata('Duas turmas têm média 7. Na turma A, as notas ficam quase todas entre 6,5 e 7,5; na B, variam de 2 a 10. Qual afirmação é correta?', 'A turma B tem maior dispersão', ['As duas têm a mesma dispersão porque a média é igual','A turma A tem maior dispersão','Não é possível comparar qualquer aspecto'], 'A média igual não implica mesma distribuição. A turma B apresenta valores muito mais afastados entre si e, portanto, maior dispersão.', 'Média descreve centro; dispersão descreve espalhamento.')
        return qdata('Um conjunto de dados tem média 20. Ao acrescentar um valor muito maior que os demais, qual efeito é mais provável?', 'A média aumenta e pode ficar menos representativa do centro típico', ['A média obrigatoriamente diminui','A mediana sempre dobra','Nada muda porque a média é fixa'], 'A média utiliza todos os valores e é sensível a extremos. Um valor muito alto puxa a média para cima.', 'Pense em como um valor extremo entra na soma usada pela média.')
    if sk=='Probabilidade':
        if g in (7,8):
            return qdata('Uma urna contém 3 bolas azuis e 2 verdes, todas com a mesma chance de serem retiradas. Qual é a probabilidade de retirar uma bola verde em uma única retirada?', '2/5', ['3/5','1/2','2/3'], 'Há 2 resultados favoráveis entre 5 bolas igualmente prováveis: P=2/5.', 'Probabilidade simples = casos favoráveis/casos possíveis.', solution=['favoráveis=2','possíveis=5','P=2/5.'])
        if g==9:
            return qdata('Um dado honesto é lançado uma vez. Qual é a probabilidade de sair um número maior que 4?', '1/3', ['1/6','1/2','2/3'], 'Os resultados favoráveis são 5 e 6: 2 de 6. Logo, 2/6=1/3.', 'Liste os resultados favoráveis dentro de {1,2,3,4,5,6}.', solution=['favoráveis={5,6}','2/6=1/3.'])
        return qdata('Uma caixa possui 4 peças boas e 1 defeituosa. Uma peça é escolhida ao acaso. Qual é a probabilidade de ela ser defeituosa?', '1/5', ['4/5','1/4','5/1'], 'Existe 1 peça defeituosa entre 5 peças no total, logo P=1/5.', 'Conte casos favoráveis e total de casos.', solution=['1 defeituosa / 5 totais = 1/5.'])
    if sk=='Escala e proporcionalidade':
        return qdata('Em um mapa na escala 1:50 000, a distância entre dois pontos é 6 cm. Qual é a distância real?', '3 km', ['300 m','30 km','300 km'], 'Cada 1 cm representa 50 000 cm=500 m. Assim, 6 cm representam 3000 m=3 km.', 'Converta a escala para uma unidade prática antes de multiplicar.', solution=['1 cm -> 500 m','6 cm -> 3000 m = 3 km.'])
    if sk=='Congruência e transformações':
        return qdata('Um triângulo é girado 90° em torno de um ponto, sem deformação. Qual propriedade permite afirmar que a imagem é congruente ao original?', 'As distâncias e os ângulos são preservados pela rotação', ['A área sempre dobra','Todos os vértices passam a ter a mesma coordenada','O perímetro é trocado pela área'], 'Rotações são isometrias: preservam comprimentos e ângulos, portanto preservam forma e tamanho.', 'Pergunte o que uma rotação rígida mantém inalterado.')
    if sk=='Semelhança e escala':
        return qdata('Dois triângulos semelhantes têm lados correspondentes na razão 2:5. Se um lado do menor mede 8 cm, quanto mede o lado correspondente do maior?', '20 cm', ['10 cm','13 cm','40 cm'], 'O fator do menor para o maior é 5/2. Então 8·5/2=20 cm.', 'Use a mesma razão entre lados correspondentes.', solution=['fator=5/2','8·5/2=20.'])
    if sk=='Volume de prismas e cilindros':
        return qdata('Um cilindro tem raio 3 cm e altura 10 cm. Usando π≈3,14, qual é o volume aproximado?', '282,6 cm³', ['94,2 cm³','188,4 cm³','565,2 cm³'], 'V=πr²h=3,14·9·10=282,6 cm³.', 'Use V=πr²h; o raio precisa ser elevado ao quadrado.', solution=['r²=9','V=3,14·9·10=282,6.'], calc=True)
    if sk=='Média, mediana e moda':
        if g==10:
            return qdata('As notas 4, 6, 6, 8 e 11 têm qual mediana e qual moda?', 'Mediana 6 e moda 6', ['Mediana 7 e moda 6','Mediana 6 e moda 11','Mediana 8 e moda 6'], 'A lista já está ordenada: o valor central é 6. O valor que mais se repete também é 6.', 'Mediana é posição central; moda é frequência maior.')
        return qdata('Os tempos, em minutos, foram 10, 12, 12, 13 e 18. Qual é a média?', '13 minutos', ['12 minutos','13,5 minutos','15 minutos'], 'A soma é 65 e há 5 valores. 65/5=13.', 'Some todos os valores e divida pela quantidade.', solution=['10+12+12+13+18=65','65/5=13.'])
    if sk=='Conjuntos e números reais':
        return qdata('Qual número é irracional?', '√2', ['-3','0,25','7/8'], '√2 não pode ser escrito como razão de dois inteiros. Os demais são racionais.', 'Procure o número que não possui representação fracionária exata.')
    if sk=='Teorema de Pitágoras':
        return qdata('Uma escada de 10 m encosta em uma parede. A base está a 6 m da parede. A que altura a escada alcança?', '8 m', ['4 m','16 m','√136 m'], 'Forma-se um triângulo retângulo: h²+6²=10², então h²=64 e h=8.', 'A escada é a hipotenusa.', solution=['h²+36=100','h²=64','h=8.'])
    if sk=='Juros compostos':
        return qdata('R$ 1.000 são aplicados a 10% ao ano por 2 anos, com capitalização composta. Qual é o montante?', 'R$ 1.210', ['R$ 1.200','R$ 1.100','R$ 1.220'], 'Em juros compostos, M=C(1+i)^t=1000·1,1²=1210.', 'O segundo ano incide também sobre os juros do primeiro.', solution=['M=1000·(1,10)^2','M=1210.'])
    if sk=='Juros simples':
        return qdata('Um capital de R$ 800 é aplicado a juros simples de 2% ao mês por 5 meses. Qual é o juro total?', 'R$ 80', ['R$ 16','R$ 88','R$ 880'], 'J=C·i·t=800·0,02·5=80.', 'Em juros simples, a taxa incide sempre sobre o capital inicial.', solution=['J=800·0,02·5=80.'])
    if sk=='Porcentagens sucessivas':
        return qdata('Um preço aumenta 20% e depois recebe desconto de 20%. Em relação ao preço inicial, o resultado final é:', '4% menor', ['igual ao inicial','4% maior','20% menor'], 'Os percentuais sucessivos atuam sobre bases diferentes: 1,20·0,80=0,96. O final é 96% do inicial, isto é, 4% menor.', 'Multiplique os fatores 1,20 e 0,80; não cancele percentuais.', solution=['1,20·0,80=0,96.'])
    if sk=='Probabilidade condicional introdutória':
        return qdata('Em uma turma há 12 meninas, das quais 3 usam óculos. Sabendo que a pessoa escolhida é menina, qual é a probabilidade de ela usar óculos?', '1/4', ['3/20','3/12? Não: 3/12=1/4','3/8'], 'A condição restringe o espaço amostral às 12 meninas. Dessas, 3 usam óculos: 3/12=1/4.', 'Depois da condição, conte apenas dentro do grupo informado.')
    if sk=='Dispersão e leitura de gráficos':
        return qdata('Duas séries têm a mesma média 50. A série X varia de 48 a 52; a Y varia de 20 a 80. Qual conclusão é sustentada apenas por essas informações?', 'Y apresenta maior amplitude e maior espalhamento observado', ['X tem média maior','Y tem necessariamente menor desvio padrão sem cálculo','As séries são idênticas'], 'A amplitude de X é 4 e a de Y é 60. Isso mostra maior espalhamento observado em Y; médias iguais não tornam as distribuições iguais.', 'Compare o intervalo entre mínimo e máximo.')
    if sk=='Relações trigonométricas':
        return qdata('Em um triângulo retângulo, em relação a um ângulo θ, o cateto oposto mede 6 e o adjacente mede 8. Qual relação calcula diretamente tan(θ)?', 'tan(θ)=6/8', ['tan(θ)=8/6','tan(θ)=6/10','tan(θ)=8/10'], 'Tangente é cateto oposto dividido pelo cateto adjacente: 6/8.', 'Identifique oposto e adjacente antes de escolher a razão.')
    if sk=='Seno, cosseno e tangente':
        return qdata('Num triângulo retângulo, a hipotenusa mede 13 e o cateto oposto a θ mede 5. Qual é sen(θ)?', '5/13', ['12/13','5/12','13/5'], 'Seno é cateto oposto/hipotenusa, portanto 5/13.', 'sen = oposto/hipotenusa.')
    if sk=='Trigonometria no triângulo retângulo':
        return qdata('Uma rampa sobe 3 m ao longo de uma projeção horizontal de 4 m. Qual é a tangente do ângulo de inclinação com o chão?', '3/4', ['4/3','3/5','4/5'], 'Para o ângulo com o chão, o cateto oposto é a subida 3 e o adjacente é 4: tan=3/4.', 'Tangente relaciona subida vertical e avanço horizontal.')
    if sk=='Função exponencial':
        return qdata('Uma cultura começa com 200 bactérias e dobra a cada hora. Qual função descreve a quantidade após t horas?', 'N(t)=200·2^t', ['N(t)=200+2t','N(t)=2·200^t','N(t)=200·t²'], 'Dobrar a cada unidade de tempo caracteriza multiplicação repetida por 2, logo uma função exponencial com valor inicial 200.', 'Identifique valor inicial e fator multiplicativo.')
    if sk=='Logaritmos':
        return qdata('Se log₂(x)=5, qual é o valor de x?', '32', ['10','25','64'], 'log₂(x)=5 significa exatamente 2^5=x. Como 2^5=32, x=32.', 'Reescreva a igualdade logarítmica na forma exponencial.')
    if sk=='Equação da reta':
        return qdata('Qual é a equação da reta de coeficiente angular 3 que passa pelo ponto (0, -2)?', 'y=3x-2', ['y=-2x+3','y=3x+2','y=x-2'], 'Na forma y=mx+b, m=3. Como a reta passa por (0,-2), b=-2.', 'Em x=0, o valor de y revela o termo independente.')
    if sk=='Geometria analítica':
        return qdata('Qual é a distância entre os pontos A(1,2) e B(4,6)?', '5', ['3','4','7'], 'Δx=3 e Δy=4. Pela distância no plano, d=√(3²+4²)=5.', 'As diferenças horizontal e vertical formam catetos de um triângulo retângulo.', solution=['Δx=3, Δy=4','d=√(9+16)=5.'])
    if sk=='Ponto médio':
        return qdata('Qual é o ponto médio do segmento com extremidades A(-2,4) e B(6,10)?', '(2, 7)', ['(4,14)','(2,6)','(-4,7)'], 'Faça a média das coordenadas: x=(-2+6)/2=2 e y=(4+10)/2=7.', 'Calcule separadamente a média dos x e a média dos y.')
    if sk=='Matemática financeira':
        return qdata('Uma dívida de R$ 1.500 é quitada com acréscimo total de 8% sobre o valor original. Qual é o valor pago?', 'R$ 1.620', ['R$ 1.508','R$ 1.580','R$ 1.700'], '8% de 1500 é 120; somando ao principal, 1620.', 'Transforme 8% em 0,08 e aplique ao valor original.', solution=['1500·0,08=120','1500+120=1620.'])
    if sk=='Potências de i':
        return qdata('Qual é o valor de i^10?', '-1', ['1','i','-i'], 'As potências de i repetem ciclo de 4. Como 10 deixa resto 2 na divisão por 4, i^10=i²=-1.', 'Reduza o expoente módulo 4.')
    if sk=='Raízes de polinômios':
        return qdata('Qual número é raiz de p(x)=x²-5x+6?', '2', ['0','1','5'], 'p(2)=4-10+6=0, logo 2 é raiz. De fato, x²-5x+6=(x-2)(x-3).', 'Uma raiz faz o polinômio valer zero.')
    if sk=='Análise combinatória':
        return qdata('Uma senha é formada por 2 letras distintas escolhidas entre A, B, C, D, com ordem importando. Quantas senhas são possíveis?', '12', ['6','8','16'], 'Há 4 escolhas para a primeira letra e 3 para a segunda: 4·3=12.', 'Como não pode repetir e a ordem importa, o número de opções muda na segunda posição.')
    if sk=='Análise crítica de gráficos':
        return qdata('Um gráfico de barras compara valores 98 e 100, mas o eixo vertical começa em 97. As barras parecem ter alturas muito diferentes. Qual cuidado é necessário?', 'Verificar a escala do eixo, pois o corte pode exagerar visualmente uma diferença pequena', ['Concluir que 100 é o dobro de 98','Ignorar os valores e olhar apenas o tamanho das barras','Assumir que todo eixo deve começar em 97'], 'O intervalo truncado amplia visualmente a diferença de 2 unidades. A leitura crítica considera valores, origem e escala dos eixos.', 'Observe onde o eixo começa e qual intervalo cada marca representa.')
    if sk=='Igualdade e equivalência':
        return qdata('Qual expressão mantém a igualdade 18+7=25 ao realizar a mesma alteração nos dois lados?', '18+7+3=25+3', ['18+7+3=25','18+7=25+3','18+3=25+7'], 'Uma igualdade é preservada quando a mesma operação é feita nos dois membros. Somar 3 dos dois lados mantém valores equivalentes.', 'Pense em uma balança: a mesma mudança precisa ocorrer nos dois lados.')
    if sk=='Localização no plano cartesiano':
        return qdata('Um ponto está 4 unidades à direita da origem e 3 unidades abaixo dela. Quais são suas coordenadas?', '(4, -3)', ['(-4, 3)','(3, -4)','(4, 3)'], 'Direita indica x positivo: 4. Abaixo indica y negativo: -3. Logo (4,-3).', 'Primeiro vem a coordenada horizontal x; depois a vertical y.')
    if sk=='Sólidos e planificações':
        return qdata('Uma planificação possui 6 quadrados congruentes e pode ser dobrada sem sobreposição formando um sólido. Qual sólido ela pode representar?', 'Cubo', ['Cilindro','Cone','Pirâmide triangular'], 'Um cubo possui 6 faces quadradas congruentes; uma planificação adequada reúne exatamente essas faces de modo dobrável.', 'Conte e identifique o formato das faces.')
    if sk=='Probabilidade simples':
        return qdata('Uma roleta tem 8 setores iguais, 3 amarelos e 5 azuis. Qual é a chance de parar no amarelo?', '3/8', ['5/8','3/5','1/8'], 'São 3 setores favoráveis entre 8 setores equiprováveis: 3/8.', 'Casos favoráveis dividido pelo total.')
    if sk=='Volume por cubos':
        return qdata('Uma construção é formada por 3 camadas iguais, cada uma com 4 fileiras de 5 cubinhos. Quantos cubinhos há ao todo?', '60', ['12','20','45'], 'Cada camada tem 4·5=20 cubos; em 3 camadas, 3·20=60.', 'Conte comprimento × largura × altura em unidades cúbicas.')
    if sk=='Operações com frações':
        return qdata('Quanto é 3/4 - 1/6?', '7/12', ['2/10','1/2','5/12'], 'O MMC de 4 e 6 é 12: 3/4=9/12 e 1/6=2/12. Então 9/12-2/12=7/12.', 'Use denominador comum antes de subtrair.', solution=['3/4=9/12','1/6=2/12','9/12-2/12=7/12.'])
    if sk=='Plano cartesiano':
        return qdata('O ponto P(-2,5) está em qual região do plano?', 'x negativo e y positivo', ['x positivo e y negativo','x e y positivos','x e y negativos'], 'Em P(-2,5), a coordenada x é negativa e a y é positiva.', 'Leia o sinal de cada coordenada separadamente.')
    if sk=='Polígonos e classificação':
        return qdata('Um polígono possui 8 lados. Como ele é classificado pelo número de lados?', 'Octógono', ['Hexágono','Heptágono','Decágono'], 'Polígonos de oito lados são octógonos.', 'Relacione o prefixo “octo” ao número 8.')
    if sk=='MDC e MMC':
        return qdata('Dois sinais piscam a cada 12 s e 18 s. Se piscam juntos agora, depois de quanto tempo voltarão a piscar juntos?', '36 s', ['6 s','30 s','216 s'], 'O reencontro ocorre em um múltiplo comum mínimo: MMC(12,18)=36.', 'Eventos periódicos que precisam coincidir novamente pedem o MMC.')
    if sk=='Números primos e compostos':
        return qdata('Qual dos números abaixo é primo?', '29', ['21','27','33'], '29 só tem divisores positivos 1 e 29. Os demais são divisíveis por 3.', 'Teste divisores pequenos; um primo tem exatamente dois divisores positivos.')
    if sk=='Triângulos e ângulos':
        return qdata('Dois ângulos internos de um triângulo medem 48° e 67°. Quanto mede o terceiro?', '65°', ['55°','75°','115°'], 'A soma dos ângulos internos de um triângulo é 180°. Então 180-48-67=65°.', 'Some os dois conhecidos e subtraia de 180°.')
    if sk=='Operações com racionais':
        return qdata('Calcule -2,5 + 3/4.', '-1,75', ['-3,25','-2,25','1,75'], '3/4=0,75. Assim, -2,5+0,75=-1,75.', 'Converta os dois valores para a mesma forma e cuide dos sinais.')
    if sk=='Leitura crítica de gráficos':
        return qdata('Um gráfico mostra vendas de 100 e 105 unidades, mas o eixo vertical começa em 99. Qual interpretação é mais cuidadosa?', 'A diferença real é 5 unidades; o eixo truncado pode fazê-la parecer muito maior', ['As vendas mais que dobraram','A diferença é 105 unidades','O gráfico prova crescimento de 500%'], 'A leitura deve considerar os valores e a escala. Começar o eixo perto dos dados amplia visualmente pequenas diferenças.', 'Leia os números do eixo antes de comparar apenas as alturas.')
    if sk=='Notação científica':
        return qdata('Escreva 0,000072 em notação científica.', '7,2×10⁻⁵', ['72×10⁻⁵','7,2×10⁵','0,72×10⁻⁴'], 'Movemos a vírgula 5 casas para a direita para obter 7,2; por isso o expoente é -5.', 'O coeficiente deve ficar entre 1 e 10.')
    if sk=='Princípio multiplicativo':
        return qdata('Uma pessoa pode escolher 3 camisetas e 4 calças. Quantos conjuntos diferentes de uma camiseta e uma calça podem ser formados?', '12', ['7','16','24'], 'Para cada uma das 3 camisetas existem 4 escolhas de calça: 3·4=12.', 'Quando decisões independentes acontecem em sequência, multiplique as quantidades.')
    if sk=='Produtos notáveis e fatoração':
        return qdata('Qual é a fatoração de x²-9?', '(x-3)(x+3)', ['(x-9)(x+1)','(x-3)²','x(x-9)'], 'É uma diferença de quadrados: x²-3²=(x-3)(x+3).', 'Reconheça a forma a²-b².')
    if sk=='Circunferência e círculo':
        return qdata('Uma circunferência tem raio 5 cm. Usando π≈3,14, qual é seu comprimento?', '31,4 cm', ['15,7 cm','25 cm','78,5 cm'], 'C=2πr=2·3,14·5=31,4 cm.', 'Comprimento da circunferência usa 2πr.', calc=True)
    if sk=='Geometria analítica básica':
        return qdata('Os pontos A(2,1) e B(2,7) formam um segmento vertical. Qual é seu comprimento?', '6', ['2','8','14'], 'Como x é igual nos dois pontos, basta a diferença vertical: |7-1|=6.', 'Para segmento vertical, compare apenas as coordenadas y.')
    if sk=='Eventos dependentes e independentes':
        return qdata('Uma moeda é lançada duas vezes. O resultado do primeiro lançamento altera a probabilidade de cara no segundo?', 'Não; os lançamentos são independentes', ['Sim; cara primeiro impede cara depois','Sim; a probabilidade vira 1/4 no segundo','Não; porque a moeda deixa de ter dois resultados'], 'Em lançamentos separados de uma moeda honesta, o segundo resultado não depende do primeiro; P(cara)=1/2 em cada lançamento.', 'Pergunte se o primeiro evento muda o espaço de possibilidades do segundo.')
    # fallback para matemática: pergunta conceitual explicitamente ligada à habilidade.
    return qdata(f'Qual afirmação descreve corretamente a habilidade matemática “{sk}” em uma resolução?',
                 f'É preciso aplicar a definição e conferir se o resultado satisfaz as condições do problema.',
                 ['Basta escolher a alternativa com maior número.','O procedimento independe dos dados do enunciado.','Qualquer operação produz uma resposta equivalente.'],
                 f'Em {sk}, a resposta precisa seguir a definição da habilidade e ser conferida contra as condições fornecidas.',
                 'Procure a alternativa que respeita o mecanismo matemático e as condições do problema.')

def nonmath_q(sub,g,area,sk):
    if sub=='Artes' and sk=='Música':
        variants={10:('Em uma canção, a bateria repete um padrão regular enquanto a voz executa a sequência principal de notas. O padrão da bateria está ligado principalmente a qual elemento musical?','Ritmo',['Melodia','Perspectiva','Proporção'],'Ritmo organiza durações, pulsações e acentos no tempo; a sequência de alturas cantada está mais ligada à melodia.'),
                  11:('Uma mesma melodia é apresentada primeiro por violão solo e depois por um conjunto de cordas, sem alterar a sequência principal de notas. O que mudou de forma mais evidente?','Timbre e arranjo',['A letra obrigatoriamente','A duração total obrigatoriamente','A tonalidade necessariamente'],'Mudar instrumentos altera o timbre e o arranjo, mesmo que a linha melódica principal permaneça reconhecível.'),
                  12:('Uma obra musical contemporânea combina ritmos de uma tradição local com recursos eletrônicos. Qual análise é mais adequada?','A obra pode articular referências culturais e tecnologias sem que uma anule a outra',['O uso eletrônico elimina qualquer identidade cultural','Só música sem tecnologia pode representar cultura','Misturar referências impede interpretação estética'],'Produções musicais podem dialogar com tradições e tecnologias simultaneamente; a análise deve observar como esses elementos são organizados.')}
        p,c,d,e=variants[g];return qdata(p,c,d,e,'Identifique o elemento musical efetivamente descrito.',qtype='interpretação')
    if sub=='Artes' and sk=='Patrimônio cultural':
        variants={10:('Uma comunidade mantém uma festa transmitida entre gerações, com músicas, saberes e rituais próprios. Mesmo sem ser um edifício, ela pode ser patrimônio porque:', 'práticas e saberes também podem constituir patrimônio cultural imaterial',['somente objetos antigos podem ser patrimônio','patrimônio depende de valor comercial','toda prática precisa permanecer sem mudanças'],'Patrimônio cultural inclui bens materiais e manifestações imateriais, como celebrações, ofícios e saberes.'),
                  11:('Ao restaurar um prédio histórico, qual decisão é mais coerente com preservação patrimonial?', 'documentar intervenções e preservar características significativas sem apagar evidências históricas',['substituir tudo por materiais atuais para parecer novo','impedir qualquer uso social do prédio','demolir partes antigas sempre que forem menos eficientes'],'Preservação busca manter valores históricos e culturais, com intervenções justificadas e documentadas, não transformar o bem em réplica nova.'),
                  12:('Uma manifestação cultural tradicional muda alguns elementos ao longo das gerações. Isso significa necessariamente que deixou de ser patrimônio?', 'Não; práticas culturais vivas podem se transformar mantendo vínculos de memória e identidade',['Sim; patrimônio imaterial deve ser idêntico para sempre','Sim; qualquer mudança elimina valor cultural','Não; porque patrimônio não possui relação com comunidades'],'Patrimônio imaterial é vivo e pode sofrer transformações; o vínculo social, a transmissão e os sentidos compartilhados são centrais.')}
        p,c,d,e=variants[g];return qdata(p,c,d,e,'Pense em patrimônio como memória, prática social e preservação de significado.',qtype='interpretação')
    if sub=='Educação Física':
        variants={10:('Durante uma partida escolar, um jogador percebe que a arbitragem marcou ponto para sua equipe por engano e informa o erro. Essa atitude exemplifica:', 'fair play e ética esportiva',['vantagem antidesportiva','doping estratégico','especialização precoce'],'Fair play envolve respeito às regras, adversários e integridade da competição, mesmo quando agir eticamente pode retirar uma vantagem.'),
                  11:('Um atleta usa substância proibida para aumentar artificialmente o desempenho e esconder o uso no exame. Por que isso é um problema ético além de regulamentar?', 'quebra a equidade competitiva e pode colocar a saúde em risco',['porque toda tecnologia esportiva é proibida','porque treinamento intenso é equivalente a doping','porque resultados esportivos não dependem de regras'],'Doping viola regras de igualdade competitiva e pode gerar riscos à saúde; ética esportiva não se resume a vencer.'),
                  12:('Uma competição escolar adapta regras e equipamentos para permitir participação de estudante com deficiência, mantendo o desafio esportivo. A medida é coerente com:', 'equidade e inclusão, pois remove barreiras sem exigir experiências idênticas',['privilégio indevido, pois toda adaptação é injusta','exclusão, pois categorias nunca podem ser adaptadas','neutralidade, pois acessibilidade não faz parte da ética esportiva'],'Equidade pode exigir adaptações para que participantes tenham condições reais de participação; tratar todos de modo idêntico nem sempre remove barreiras.')}
        p,c,d,e=variants[g];return qdata(p,c,d,e,'Avalie respeito às regras, integridade, segurança e inclusão.',qtype='interpretação')
    if sub=='Espanhol':
        if g==10:
            return qdata('Lee: “Lucía salió temprano porque el autobús suele tardar. Sin embargo, hoy llegó antes de lo previsto y pudo desayunar cerca de la escuela.” ¿Qué se puede concluir?', 'Lucía había previsto un posible retraso, pero el trayecto fue más rápido de lo esperado',['Lucía perdió el autobús','Lucía llegó tarde a la escuela','Lucía no tuvo tiempo para desayunar'], 'El conector “sin embargo” contrapone la expectativa de demora con la llegada anticipada.', 'Observe la relación entre “porque” y “sin embargo”.',qtype='interpretação')
        return qdata('Lee: “El museo cerraba a las seis. Marta llegó a las cinco y cuarenta, así que decidió visitar primero la sala que más le interesaba.” ¿Por qué Marta cambió el orden de la visita?', 'Porque tenía poco tiempo antes del cierre',['Porque el museo abrió tarde','Porque no quería entrar al museo','Porque la sala estaba cerrada todo el día'], 'La hora de llegada y el cierre indican una restricción de tiempo; por eso priorizó la sala de mayor interés.', 'Relaciona los horarios con la decisión de Marta.',qtype='interpretação')
    if sub=='Geografia' and sk=='Cartografia':
        if g==10:
            return qdata('Em um mapa de escala 1:100 000, dois pontos estão separados por 4 cm. Qual distância real eles representam?', '4 km',['400 m','40 km','400 km'],'1 cm representa 100 000 cm, isto é, 1 km. Logo 4 cm representam 4 km.','Converta 100 000 cm para quilômetros.',solution=['1 cm -> 1 km','4 cm -> 4 km.'])
        return qdata('Dois mapas mostram a mesma cidade: um em escala 1:25 000 e outro em 1:250 000. Qual tende a mostrar mais detalhes locais?', 'O de 1:25 000, por ter escala maior',['O de 1:250 000, porque o denominador é maior','Os dois necessariamente mostram os mesmos detalhes','Nenhum, pois escala não afeta detalhamento'],'Escala 1:25 000 representa uma área menor com maior detalhamento; quanto menor o denominador, maior a escala cartográfica.','Compare quanto território cada centímetro representa.')
    if sub=='Geografia' and sk=='Climatologia':
        if g==10:
            return qdata('“Hoje choveu 40 mm e a temperatura caiu rapidamente.” Essa frase descreve principalmente:', 'tempo atmosférico, pois trata de condições de curto prazo',['clima, pois qualquer chuva define o clima','latitude, pois descreve posição geográfica','vegetação, pois temperatura não faz parte da atmosfera'],'Tempo atmosférico refere-se às condições observadas em curto prazo; clima resulta de padrões analisados por períodos longos.','Diferencie evento de hoje de padrão de décadas.')
        return qdata('Uma área central muito construída apresenta temperaturas noturnas maiores que bairros periféricos vegetados. Qual processo urbano ajuda a explicar isso?', 'ilha de calor urbana',['maritimidade obrigatória','inversão do campo magnético','erosão glacial'],'Superfícies impermeáveis e construções absorvem e liberam calor, enquanto menor vegetação reduz resfriamento por evapotranspiração, favorecendo ilhas de calor.','Observe materiais urbanos e cobertura vegetal.')
    if sub=='Geografia' and sk=='Demografia':
        return qdata('Uma população passa a ter baixa natalidade e maior proporção de idosos. Qual desafio tende a ganhar importância?', 'adaptação de previdência, saúde e cuidados de longa duração',['expansão obrigatória de creches por explosão de nascimentos','desaparecimento imediato da população economicamente ativa','fim de qualquer migração'],'O envelhecimento aumenta a demanda por saúde e cuidados e altera a relação entre grupos etários, exigindo planejamento social e econômico.','Relacione estrutura etária com políticas públicas.')
    if sub=='Geografia' and sk=='Espaço agrário':
        return qdata('Duas regiões produzem a mesma quantidade agrícola. Na região A, poucas propriedades concentram grande parte das terras; na B, a terra é distribuída entre muitas propriedades. Qual conceito diferencia principalmente essas situações?', 'estrutura fundiária',['latitude agrícola','fuso horário rural','densidade atmosférica'],'Estrutura fundiária descreve como a terra rural está distribuída e organizada entre propriedades e proprietários.','A questão trata de distribuição da propriedade da terra.')
    if sub=='Geografia' and sk=='Urbanização':
        return qdata('Duas cidades crescem até suas áreas construídas se encontrarem fisicamente, formando uma mancha urbana contínua. Esse processo é chamado de:', 'conurbação',['êxodo rural','verticalização','intemperismo'],'Conurbação ocorre quando manchas urbanas de municípios distintos se unem fisicamente pelo crescimento urbano.','Observe a união física de áreas urbanizadas.')
    if sub=='História' and sk=='Ditadura e redemocratização':
        return qdata('No processo brasileiro de redemocratização, qual evento simboliza a retomada de uma ordem constitucional democrática após o regime militar?', 'promulgação da Constituição de 1988',['edição do AI-5 em 1968','criação do Estado Novo em 1937','Revolução de 1930'],'A Constituição de 1988 consolidou direitos e instituições democráticas no período posterior ao regime militar.','Localize cronologicamente os eventos e identifique qual pertence à redemocratização.')
    if sub=='História' and sk=='Era Vargas':
        return qdata('Qual característica ajuda a compreender o Estado Novo (1937–1945) no governo Vargas?', 'centralização autoritária do poder e restrição de liberdades políticas',['federalismo radical com autonomia irrestrita dos estados','eleições presidenciais diretas anuais','ausência de intervenção do Estado na economia e no trabalho'],'O Estado Novo foi uma ditadura marcada por centralização política, censura e controle institucional, embora também tenha ampliado políticas trabalhistas e intervenção estatal.','Diferencie Estado Novo das fases constitucionais do período Vargas.')
    if sub=='História' and sk=='Revoluções burguesas':
        return qdata('A Declaração dos Direitos do Homem e do Cidadão, de 1789, está ligada a qual transformação política da Revolução Francesa?', 'afirmação de direitos e igualdade jurídica contra privilégios de ordem',['restauração dos privilégios feudais como princípio universal','defesa do absolutismo hereditário','proibição de qualquer ideia de cidadania'],'O documento expressa princípios de direitos, cidadania e igualdade perante a lei, contrapondo-se a privilégios do Antigo Regime.','Relacione o documento à crítica aos privilégios do Antigo Regime.')
    if sub=='Inglês' and sk=='Pronouns and reference':
        if g==10:
            return qdata('Read: “The students finished the project, and they presented it on Friday.” What does “it” refer to?', 'the project',['the students','Friday','the presentation room'],'The singular object pronoun “it” refers to the previously mentioned singular noun “the project”.','Look for a singular noun that can be presented.',qtype='interpretação')
        return qdata('Read: “Maria called Ana after she arrived at the station.” The pronoun “she” is potentially ambiguous because:', 'it could refer to Maria or Ana without more context',['it can only refer to the station','English pronouns never refer to people','“she” must refer to both people at the same time'],'Both Maria and Ana are singular female antecedents, so the sentence needs more context to identify the intended referent.','Check which earlier nouns match the pronoun grammatically.',qtype='interpretação')
    if sub=='Inglês' and sk=='Vocabulary in context':
        return qdata('Read: “The new policy aims to curb unnecessary waste in public buildings.” In this context, “curb” most nearly means:', 'reduce or control',['decorate','measure exactly','ignore'],'In context, the policy seeks to limit unnecessary waste; “curb” means restrain, reduce, or control.','Use the purpose of the policy to infer the word.',qtype='interpretação')
    if sub=='Metodologia Científica':
        variants={10:('Qual opção é um problema de pesquisa investigável, e não apenas um tema amplo?', 'Como o tempo diário de uso de telas se relaciona com a duração do sono entre estudantes do 1º ano desta escola?',['Tecnologia','Sono dos jovens','A internet é ruim?'],'Um problema de pesquisa delimita fenômeno, população e relação observável; “tecnologia” e “sono” são apenas temas, e uma pergunta valorativa vaga não define investigação.'),
                  11:('Um grupo quer estudar alimentação escolar. Qual pergunta delimita melhor um problema de pesquisa?', 'Qual relação existe entre frequência de consumo da merenda e percepção de saciedade entre alunos do 2º ano durante um mês?',['Alimentação é importante?','Merenda escolar','Por que toda comida deveria ser melhor?'],'A pergunta delimita variáveis, população e período, permitindo coleta de dados e análise.'),
                  12:('Qual problema de pesquisa é mais adequado para um projeto que dispõe apenas de questionários e dados escolares, sem exames médicos?', 'Há associação entre horas declaradas de estudo semanal e frequência escolar dos concluintes?',['Qual é a causa biológica exata da ansiedade de cada estudante?','Educação brasileira','Como curar todas as dificuldades de aprendizagem?'],'O problema deve ser compatível com métodos, dados e recursos disponíveis; a associação entre estudo e frequência pode ser investigada com registros e questionários.')}
        p,c,d,e=variants[g];return qdata(p,c,d,e,'Verifique delimitação, observabilidade e viabilidade.',qtype='interpretação')
    if sub=='Projeto de Vida' and sk=='Autoconhecimento':
        variants={10:('Uma estudante percebe que gosta de explicar ideias, prefere trabalhar em pequenos grupos e se sente motivada quando vê progresso de outras pessoas. Qual uso de autoconhecimento é mais adequado?', 'tratar esses padrões como evidências para explorar atividades e carreiras, sem considerá-los destino definitivo',['escolher uma profissão para sempre com base em uma única preferência','ignorar preferências porque elas nunca ajudam decisões','copiar a escolha profissional de amigos'],'Autoconhecimento organiza evidências sobre interesses, valores e modos de trabalhar, mas deve ser testado em experiências e pode mudar.'),
                  11:('Um aluno recebe feedbacks diferentes sobre seus pontos fortes. Qual atitude demonstra autoconhecimento mais consistente?', 'comparar feedbacks com experiências próprias e procurar padrões antes de concluir',['aceitar automaticamente o elogio mais agradável','rejeitar todo feedback externo','transformar uma dificuldade atual em característica imutável'],'Autoconhecimento combina autorreflexão, evidências de comportamento e feedback; uma observação isolada não define a pessoa.'),
                  12:('Ao revisar seus objetivos, uma estudante percebe que valorizava prestígio, mas experiências recentes mostraram maior importância de autonomia e tempo. O que essa mudança indica?', 'valores e prioridades podem ser revistos à luz de novas experiências',['um objetivo antigo nunca deve ser alterado','autoconhecimento significa manter preferências fixas','mudar de prioridade prova falta de identidade'],'Projeto de vida é iterativo: novas experiências podem alterar a compreensão de valores e prioridades sem invalidar todo o percurso.')}
        p,c,d,e=variants[g];return qdata(p,c,d,e,'Procure evidências, padrões e possibilidade de revisão.',qtype='interpretação')
    if sub=='Projeto de Vida' and sk=='Tomada de decisão':
        variants={10:('Uma estudante precisa escolher entre duas atividades extracurriculares. Qual processo tende a produzir decisão mais consciente?', 'definir critérios importantes, comparar alternativas e revisar consequências prováveis',['escolher sempre a primeira opção disponível','seguir a maioria sem considerar objetivos próprios','evitar qualquer decisão até não existir incerteza'],'Decisões conscientes tornam critérios explícitos e comparam trade-offs; incerteza pode ser reduzida, não eliminada.'),
                  11:('Duas opções de curso atendem objetivos diferentes: uma custa menos, outra oferece experiência prática desejada. Qual abordagem é mais adequada?', 'atribuir importância aos critérios e comparar os trade-offs de cada opção',['somar apenas o número de vantagens sem considerar relevância','escolher pela propaganda mais atraente','tratar custo e experiência como se fossem o mesmo critério'],'Tomada de decisão melhora quando critérios distintos são explicitados e ponderados conforme os objetivos da pessoa.'),
                  12:('Uma decisão importante é difícil de reverter e envolve informação incompleta. Qual estratégia reduz risco sem fingir certeza?', 'buscar evidências relevantes, testar opções reversíveis quando possível e definir condições para reavaliar',['esperar certeza absoluta antes de agir','decidir apenas pela emoção do momento','ignorar consequências de longo prazo'],'Boas decisões reconhecem incerteza, coletam informação, usam experimentos reversíveis quando possíveis e preveem revisão.')}
        p,c,d,e=variants[g];return qdata(p,c,d,e,'Compare critérios, consequências, reversibilidade e incerteza.',qtype='interpretação')
    if sub=='Redação' and sk=='Conclusão':
        return qdata('Em uma redação sobre evasão escolar causada por dificuldades econômicas e falta de apoio, qual conclusão apresenta intervenção mais completa e ligada ao desenvolvimento?', 'O MEC, em parceria com redes locais, deve ampliar programas de permanência por meio de bolsas e equipes de acompanhamento, priorizando estudantes vulneráveis, para reduzir a evasão',['É preciso melhorar a educação de alguma forma','Portanto, a evasão é um problema e todos devem ajudar','As escolas devem falar sobre tecnologia, ainda que o texto não tenha discutido isso'],'A proposta identifica agente, ação, meio/detalhamento e finalidade, além de responder às causas discutidas no desenvolvimento.','Verifique se a solução resolve o problema realmente argumentado.',qtype='interpretação')
    if sub=='Redação' and sk=='Introdução':
        return qdata('Qual introdução cumpre melhor a função de contextualizar um tema e apresentar uma tese debatível sobre desinformação?', 'Embora o acesso à informação tenha se ampliado, a circulação de conteúdos falsos compromete decisões coletivas no Brasil, problema alimentado pela baixa educação midiática e por mecanismos de amplificação digital',['Desinformação. Este é o tema da redação.','Desde o início dos tempos existem problemas, e esse assunto é muito importante','Vou falar sobre fake news porque acho interessante'],'A alternativa apresenta contexto, problema e dois eixos argumentativos que podem ser desenvolvidos, sem apenas anunciar o tema.','Procure uma ideia central defendível e caminhos para o desenvolvimento.',qtype='interpretação')
    if sub=='Redação' and sk=='Tese':
        return qdata('Tema: “Desafios para ampliar a leitura literária entre jovens no Brasil”. Qual frase funciona melhor como tese?', 'A baixa formação de hábitos leitores e o acesso desigual a acervos dificultam a aproximação dos jovens com a literatura',['A leitura existe em muitos países','Livros podem ter capas de várias cores','Neste texto falarei sobre leitura'],'A tese apresenta um posicionamento específico e dois fatores que podem ser defendidos nos parágrafos de desenvolvimento.','Uma tese precisa dizer algo discutível sobre o problema, não apenas repetir o tema.',qtype='interpretação')
    if sub=='Robótica' and sk=='Eletrônica básica':
        if g==10:
            return qdata('Um LED é ligado diretamente a uma fonte de tensão adequada, mas sem resistor limitador, e queima rapidamente. Qual componente deveria limitar a corrente no circuito simples?', 'Resistor',['Sensor ultrassônico','Servo motor','Interruptor aberto permanentemente'],'Um resistor em série limita a corrente que atravessa o LED, protegendo o componente quando dimensionado adequadamente.','Pense no componente passivo usado para limitar corrente.')
        return qdata('Em um circuito simples, uma tensão de 5 V é aplicada a um resistor de 1 kΩ. Pela lei de Ohm, qual corrente aproximadamente circula?', '5 mA',['5 A','0,2 mA','1000 A'],'I=V/R=5/1000 A=0,005 A=5 mA.','Use I=V/R e converta amperes para miliamperes.',solution=['I=5/1000=0,005 A=5 mA.'])
    if sub=='Robótica' and sk=='Atuadores':
        return qdata('Em um robô, qual componente é um atuador?', 'um servo que movimenta uma articulação',['um sensor de luminosidade','um sensor ultrassônico','um termistor que mede temperatura'],'Atuadores transformam comandos/energia em ação física; o servo produz movimento. Sensores medem grandezas do ambiente.','Pergunte qual componente age fisicamente no ambiente.')
    if sub=='Robótica' and sk=='Sensores':
        return qdata('Um robô precisa detectar a distância até uma parede para evitar colisão. Qual componente cumpre diretamente a função de sensor?', 'sensor ultrassônico de distância',['motor DC','servo de direção','engrenagem redutora'],'O sensor ultrassônico mede distância a partir do tempo de propagação do som; motores e servos são atuadores.','Diferencie medir o ambiente de produzir movimento.')
    return qdata(f'Qual análise aplica corretamente a habilidade “{sk}” em {sub}?',
                 'A alternativa que usa evidências do contexto e respeita a definição do conceito.',
                 ['A alternativa baseada apenas em uma palavra solta.','A alternativa que ignora o contexto apresentado.','Qualquer alternativa, pois conceitos não possuem critérios.'],
                 f'Para aplicar {sk}, é necessário relacionar o conceito às evidências concretas do enunciado, evitando generalizações sem suporte.',
                 'Procure a alternativa que liga definição e contexto.',qtype='interpretação')

def load_packs():
    packs={}; allq=[]
    for f in sorted((ROOT/'data/questions').glob('*.js')):
        s=f.read_text()
        m=re.search(r'AEDS_PACK_PAYLOADS\["([^"]+)"\]=\'([^\']+)\'',s)
        if not m: raise RuntimeError(f'pack inválido {f}')
        arr=json.loads(gzip.decompress(base64.b64decode(m.group(2))).decode())
        packs[m.group(1)]=(f,arr); allq.extend(arr)
    return packs,allq

def read_entries():
    out=[]
    for line in DEBT.read_text().splitlines():
        if not line.startswith('- '): continue
        left=line[2:].rsplit(' — ',1)[0]
        sub,g,area,sk=left.split('|',3)
        out.append((sub,int(g),area,sk))
    return out

def main():
    packs,allq=load_packs(); entries=read_entries(); maxn=max([q.get('n',-1) for q in allq if isinstance(q.get('n'),int)]+[-1]); added=[]
    active=[q for q in allq if q.get('active') is not False]
    def refs_for(sub,g,area,sk):
        for q in active:
            if q.get('subject')==sub and int(q.get('grade',0))==g and q.get('area')==area and q.get('skill')==sk and q.get('references'):
                return q['references'][:]
        return []
    for idx,(sub,g,area,sk) in enumerate(entries,1):
        d=math_q(g,area,sk) if sub=='Matemática' else nonmath_q(sub,g,area,sk)
        seed=f'{sub}|{g}|{area}|{sk}|909'
        opts,ci=rotate(d['distractors'],d['correct'],seed)
        h=hashlib.sha1(seed.encode()).hexdigest()
        qid=f'R909-{slug(sub)[:5].upper()}-{g}-{h[:8].upper()}'
        fam=f'rastro909:{h[:16]}'; pat=f'rastro909:transfer:{h[16:28]}'
        maxn+=1
        sol=d['solution'][:] if d['solution'] else [d['explanation']]
        q={
            'id':qid,'subject':sub,'grade':g,'area':area,'skill':sk,'difficulty':d['difficulty'],'type':d['qtype'],
            'prompt':f'{g}º ano · {d["prompt"]}' if g<=9 else d['prompt'],'hint':d['hint'],'options':opts,'correctIndex':ci,'correctText':d['correct'],
            'explanation':d['explanation'],'references':refs_for(sub,g,area,sk),'origin':{'type':'autoral_aeds','label':'Contraprova autoral AEDS Rastro 2.1'},
            'version':'9.0.9','n':maxn,'family':fam,'rootFamily':fam,'template':pat,'patternFamily':pat,'solutionSteps':sol,
            'whyCorrect':d['explanation'],'questionType':'multiple_choice','calculatorAllowed':bool(d['calc']),
            'editorial':{'version':'9.0.9','status':'published','purpose':'rastro_counterproof','review':'strict'}
        }
        key=f'{sub}|{g}'
        if key not in packs: raise RuntimeError('pack ausente '+key)
        packs[key][1].append(q);added.append(q)
    # regrava somente packs alterados, em formato determinístico compacto
    touched=set(f'{q["subject"]}|{q["grade"]}' for q in added)
    for key in touched:
        f,arr=packs[key]
        raw=json.dumps(arr,ensure_ascii=False,separators=(',',':')).encode(); b64=base64.b64encode(gzip.compress(raw,compresslevel=9,mtime=0)).decode()
        f.write_text(f'window.AEDS_PACK_PAYLOADS=window.AEDS_PACK_PAYLOADS||{{}};window.AEDS_PACK_PAYLOADS["{key}"]=\'{b64}\';\n')
    (ROOT/'rastro-counterproofs-909.json').write_text(json.dumps(added,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'added':len(added),'touchedPacks':len(touched),'lastN':maxn},ensure_ascii=False))
if __name__=='__main__': main()
