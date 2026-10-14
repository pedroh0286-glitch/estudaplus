#!/usr/bin/env python3
import pathlib,re,gzip,base64,json,hashlib
ROOT=pathlib.Path(__file__).resolve().parent
U={
'R909-MATEM-11-A97BAE54': dict(prompt='Duas turmas têm média 7. Na turma A, quase todas as notas ficam entre 6 e 8; na turma B, há notas entre 2 e 10. Qual conclusão é sustentada por essas informações?',correct='A turma B apresenta maior dispersão das notas',d=['As duas turmas têm a mesma dispersão porque a média é igual','A turma A necessariamente tem maior desvio','Não é possível comparar o espalhamento em nenhuma hipótese'],ex='A média descreve o centro, mas não o espalhamento. Como as notas da turma B ocupam um intervalo muito mais amplo, os dados indicam maior dispersão em torno do centro.',hint='Separe a ideia de valor central da ideia de espalhamento.'),
'R909-MATEM-12-9EA643E8': dict(prompt='Os valores 4, 6, 6, 7, 9, 10 e 14 estão em ordem crescente. Qual afirmação descreve corretamente uma medida de posição desse conjunto?',correct='A mediana é 7',d=['A mediana é 6','A moda é 7','A média é necessariamente 7'],ex='Há sete valores ordenados, então a mediana é o quarto termo. O quarto valor é 7. A moda é 6, e a média usa a soma de todos os valores.',hint='Com quantidade ímpar de dados ordenados, localize exatamente o termo central.'),
'R909-MATEM-9-A56BBCA6': dict(ex='O volume do cilindro é V=πr²h. Substituindo r=3 cm, h=10 cm e π≈3,14: V=3,14·9·10=282,6 cm³; o raio precisa ser elevado ao quadrado.'),
'R909-MATEM-9-B2C90280': dict(ex='O comprimento da circunferência é C=2πr. Com r=5 cm e π≈3,14, temos C=2·3,14·5=31,4 cm; não se usa a fórmula de área.'),
'R909-ROBOT-11-4E085B1C': dict(ex='Pela lei de Ohm, I=V/R. Assim, I=5/1000 A=0,005 A. Como 1 A corresponde a 1000 mA, a corrente é 5 mA.'),
'R909-MATEM-9-5B36784E': dict(prompt='A área de um retângulo é representada por x²+5x+6. Se um dos lados mede x+2, qual expressão representa o outro lado?',correct='x+3',d=['x+6','x-3','x²+3'],ex='Fatorando o trinômio, x²+5x+6=(x+2)(x+3). Como um lado já é x+2, o outro fator — e portanto o outro lado — é x+3.',hint='Procure dois números cujo produto seja 6 e cuja soma seja 5.')
}
def rotate(correct,d,seed):
    opts=[correct]+[x for x in d if x!=correct];sh=int(hashlib.sha1(seed.encode()).hexdigest()[:2],16)%len(opts);opts=opts[sh:]+opts[:sh];return opts,opts.index(correct)
changed=[]
for f in (ROOT/'data/questions').glob('*.js'):
    s=f.read_text();m=re.search(r'AEDS_PACK_PAYLOADS\["([^"]+)"\]=\'([^\']+)\'',s)
    if not m: continue
    arr=json.loads(gzip.decompress(base64.b64decode(m.group(2))))
    hit=False
    for q in arr:
        u=U.get(q.get('id'))
        if not u: continue
        if 'prompt' in u: q['prompt']=u['prompt']
        if 'ex' in u: q['explanation']=u['ex'];q['whyCorrect']=u['ex']
        if 'hint' in u:q['hint']=u['hint']
        if 'correct' in u:
            opts,ci=rotate(u['correct'],u['d'],q['id']+'quality');q['options']=opts;q['correctIndex']=ci;q['correctText']=u['correct']
        hit=True;changed.append(q['id'])
    if hit:
        raw=json.dumps(arr,ensure_ascii=False,separators=(',',':')).encode();b64=base64.b64encode(gzip.compress(raw,9,mtime=0)).decode();f.write_text(f'window.AEDS_PACK_PAYLOADS=window.AEDS_PACK_PAYLOADS||{{}};window.AEDS_PACK_PAYLOADS["{m.group(1)}"]=\'{b64}\';\n')
print(json.dumps({'changed':changed},ensure_ascii=False))
