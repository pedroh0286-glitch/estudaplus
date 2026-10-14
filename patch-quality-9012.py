from pathlib import Path
import re,base64,gzip,json,io
ROOT=Path(__file__).resolve().parent
PACKS=ROOT/'data'/'questions'
PLACE=re.compile(r'alternativa de compara[cç][aã]o|placeholder|lorem ipsum',re.I)

def load_pack(path):
    txt=path.read_text(encoding='utf-8')
    km=re.search(r'window\.AEDS_PACK_PAYLOADS\["([^"]+)"\]',txt)
    bm=re.search(r"='([^']+)';?\s*$",txt)
    if not km or not bm: raise RuntimeError(f'formato inesperado: {path}')
    rows=json.loads(gzip.decompress(base64.b64decode(bm.group(1))).decode('utf-8'))
    return km.group(1),rows

def dump_pack(path,key,rows):
    raw=json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    buf=io.BytesIO()
    with gzip.GzipFile(fileobj=buf,mode='wb',compresslevel=9,mtime=0) as gz: gz.write(raw)
    b64=base64.b64encode(buf.getvalue()).decode('ascii')
    path.write_text(f'window.AEDS_PACK_PAYLOADS=window.AEDS_PACK_PAYLOADS||{{}};window.AEDS_PACK_PAYLOADS["{key}"]=\'{b64}\';\n',encoding='utf-8')

def wrong_explanation(q,opt):
    p=q.get('prompt','')
    if 'massa de 2 kg' in p and 'força resultante' in p:
        return f'Incorreta. Pela 2ª lei de Newton, F = m·a = 2·1 = 2 N; {opt} não resulta desse cálculo.'
    if 'resistor de 2 Ω' in p:
        return f'Incorreta. Pela lei de Ohm, U = R·I = 2·1 = 2 V; {opt} não corresponde ao cálculo.'
    if 'força de 5 N' in p and 'trabalho' in p:
        return f'Incorreta. Como força e deslocamento têm a mesma direção, W = F·d = 5·2 = 10 J; {opt} não corresponde.'
    if 'massa molar 10 g/mol' in p:
        return f'Incorreta. A quantidade de matéria é n = m/M = 10/10 = 1 mol; {opt} não corresponde.'
    if 'Resolva o sistema' in p:
        return f'Incorreta. Somando as equações, 2x = 4, então x = 2; substituindo em x + y = 5, y = 3. Logo {opt} não satisfaz o sistema.'
    if 'probabilidade de retirar uma vermelha' in p:
        return f'Incorreta. Há 1 resultado favorável em 3 peças no total, portanto a probabilidade é 1/3; {opt} não representa essa razão.'
    return 'Incorreta. Refaça o raciocínio indicado na explicação e compare com a resposta correta.'

patched=[]
for path in sorted(PACKS.glob('*.js')):
    key,rows=load_pack(path); changed=False
    for q in rows:
        if q.get('active') is False or q.get('questionType')!='multiple_choice': continue
        opts=list(q.get('options') or [])
        bad=[i for i,o in enumerate(opts) if PLACE.search(str(o))]
        if not bad: continue
        correct=int(q.get('correctIndex',-1))
        if correct in bad:
            q['active']=False
            q['qualityStatus']='quarantined_9012_placeholder_answer'
            q.setdefault('editorial',{})['quality9012']='quarantined: placeholder was keyed as correct answer'
        else:
            kept=[o for i,o in enumerate(opts) if i not in bad]
            if 'força resultante' in q.get('prompt','') and len(kept)<4:
                for extra in ['0,5 N','4 N']:
                    if extra not in kept: kept.append(extra)
            q['options']=kept
            # correct answer precedes all placeholders in the affected legacy items, but calculate safely.
            q['correctIndex']=sum(1 for i in range(correct) if i not in bad)
            q['correctText']=q['options'][q['correctIndex']]
            q['optionExplanations']=[('Correta. '+q.get('explanation','')) if i==q['correctIndex'] else wrong_explanation(q,opt) for i,opt in enumerate(q['options'])]
            q['misconceptions']={str(i):wrong_explanation(q,opt) for i,opt in enumerate(q['options']) if i!=q['correctIndex']}
            q['qualityStatus']='approved_9012_placeholder_repaired'
            ed=q.setdefault('editorial',{})
            ed['quality9012']='placeholder alternatives removed; distractors repaired when necessary'
            ed['reviewed']=True
            ed['version']='9.0.12'
        patched.append(q['id']); changed=True
    if changed: dump_pack(path,key,rows)
print(json.dumps({'patched':len(patched),'ids':patched},ensure_ascii=False,indent=2))
