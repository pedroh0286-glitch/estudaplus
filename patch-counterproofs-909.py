#!/usr/bin/env python3
import re,json,gzip,base64,pathlib
ROOT=pathlib.Path(__file__).resolve().parent
updates={
('Matemática',10,'Matemática financeira','Juros compostos'):{
'prompt':'Uma aplicação terminou com R$ 1.210 após 2 anos a 10% ao ano, com capitalização composta. Qual era o capital inicial?',
'correct':'R$ 1.000','distractors':['R$ 990','R$ 1.010','R$ 1.100'],
'explanation':'Em juros compostos, M=C(1+i)^t. Assim, 1210=C·1,1²=C·1,21; logo C=1210/1,21=1000.',
'hint':'Aqui o montante é conhecido; isole o capital na fórmula.', 'solution':['1210=C·1,21','C=1210/1,21=1000.']},
('Matemática',10,'Matemática financeira','Juros simples'):{
'prompt':'Um investimento de R$ 1.200 gerou R$ 180 de juros simples em 6 meses. Qual foi a taxa mensal?',
'correct':'2,5% ao mês','distractors':['1,5% ao mês','3% ao mês','15% ao mês'],
'explanation':'J=C·i·t. Então 180=1200·i·6, logo i=180/7200=0,025=2,5% ao mês.',
'hint':'Isole i em J=C·i·t.', 'solution':['i=180/(1200·6)','i=0,025=2,5%.']},
('Matemática',11,'Trigonometria','Seno, cosseno e tangente'):{
'prompt':'Em um triângulo retângulo de lados 5, 12 e 13, o ângulo α tem como cateto adjacente o lado 12. Qual é cos(α)?',
'correct':'12/13','distractors':['5/13','5/12','13/12'],
'explanation':'Cosseno é cateto adjacente dividido pela hipotenusa. Para α, o adjacente mede 12 e a hipotenusa 13, então cos(α)=12/13.',
'hint':'cos = adjacente/hipotenusa.', 'solution':['cos(α)=12/13.']},
('Matemática',12,'Geometria analítica','Ponto médio'):{
'prompt':'O ponto M(4,3) é o ponto médio de A(1,-2) e B(x,y). Quais são as coordenadas de B?',
'correct':'(7, 8)','distractors':['(3, 5)','(5, 1)','(8, 7)'],
'explanation':'Pelo ponto médio, (1+x)/2=4 e (-2+y)/2=3. Assim x=7 e y=8.',
'hint':'Use as duas coordenadas do ponto médio para montar duas equações.', 'solution':['(1+x)/2=4 → x=7','(-2+y)/2=3 → y=8.']},
('Matemática',12,'Polinômios e números complexos','Potências de i'):{
'prompt':'As potências de i repetem um ciclo de quatro termos. Qual potência abaixo tem o mesmo valor que i?',
'correct':'i^37','distractors':['i^38','i^39','i^40'],
'explanation':'Expoentes congruentes a 1 módulo 4 produzem i. Como 37=4·9+1, i^37=i.',
'hint':'Divida cada expoente por 4 e observe o resto.', 'solution':['37 mod 4 = 1','i^37=i.']},
('Matemática',5,'Grandezas, probabilidade e dados','Probabilidade simples'):{
'prompt':'Dentro de uma sacola há 4 fichas vermelhas, 3 verdes e 1 branca. Retirando uma ficha ao acaso, qual é a probabilidade de ela ser branca?',
'correct':'1/8','distractors':['1/4','3/8','4/8'],
'explanation':'Há 8 fichas no total e apenas 1 branca. Portanto a probabilidade é 1/8.',
'hint':'Conte o total de fichas e quantas atendem ao evento.', 'solution':['total=4+3+1=8','favoráveis=1','P=1/8.']},
('Matemática',7,'Geometria','Triângulos e ângulos'):{
'prompt':'Em um triângulo, um ângulo externo mede 125° e um dos ângulos internos não adjacentes mede 52°. Quanto mede o outro ângulo interno não adjacente?',
'correct':'73°','distractors':['55°','63°','177°'],
'explanation':'Um ângulo externo é igual à soma dos dois ângulos internos não adjacentes. Logo 125=52+x e x=73°.',
'hint':'Use a relação entre ângulo externo e os dois internos não adjacentes.', 'solution':['125=52+x','x=73°.']},
}

def rotate(correct,distractors,seed):
 import hashlib
 opts=[correct]+distractors
 sh=int(hashlib.sha1(seed.encode()).hexdigest()[:2],16)%len(opts)
 opts=opts[sh:]+opts[:sh]
 return opts,opts.index(correct)

touched=set();updated=[]
for f in (ROOT/'data/questions').glob('*.js'):
    s=f.read_text(); m=re.search(r'AEDS_PACK_PAYLOADS\["([^"]+)"\]=\'([^\']+)\'',s)
    if not m: continue
    arr=json.loads(gzip.decompress(base64.b64decode(m.group(2))).decode())
    changed=False
    for q in arr:
        key=(q.get('subject'),int(q.get('grade',0)),q.get('area'),q.get('skill'))
        if q.get('editorial',{}).get('version')=='9.0.9' and key in updates:
            u=updates[key]; opts,ci=rotate(u['correct'],u['distractors'],'|'.join(map(str,key))+'|909b')
            q.update(prompt=u['prompt'],options=opts,correctIndex=ci,correctText=u['correct'],explanation=u['explanation'],whyCorrect=u['explanation'],hint=u['hint'],solutionSteps=u['solution'])
            changed=True; updated.append(q['id'])
    if changed:
        raw=json.dumps(arr,ensure_ascii=False,separators=(',',':')).encode(); b64=base64.b64encode(gzip.compress(raw,9,mtime=0)).decode(); f.write_text(f'window.AEDS_PACK_PAYLOADS=window.AEDS_PACK_PAYLOADS||{{}};window.AEDS_PACK_PAYLOADS["{m.group(1)}"]=\'{b64}\';\n'); touched.add(m.group(1))
# rebuild exported counterproof list from packs
counter=[]
for f in (ROOT/'data/questions').glob('*.js'):
    s=f.read_text(); m=re.search(r"='([^']+)'",s); arr=json.loads(gzip.decompress(base64.b64decode(m.group(1))).decode()); counter.extend(q for q in arr if q.get('editorial',{}).get('version')=='9.0.9')
(ROOT/'rastro-counterproofs-909.json').write_text(json.dumps(counter,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'updated':len(updated),'touched':sorted(touched),'ids':updated},ensure_ascii=False))
