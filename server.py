"""Servidor do jogo: serve os arquivos estáticos e faz proxy (com cache) da API do PubChem.

Rodar:  python server.py   ->  http://localhost:8000
"""
import json
import os
import urllib.parse
import urllib.request
from functools import lru_cache, partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/'
PROPS = 'MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES'


@lru_cache(maxsize=256)  # erros não entram no cache, então uma falha de rede é tentada de novo
def molecula(nome):
    url = BASE + urllib.parse.quote(nome) + '/property/' + PROPS + '/JSON'
    with urllib.request.urlopen(url, timeout=15) as r:
        p = json.load(r)['PropertyTable']['Properties'][0]
    return {'cid': p['CID'], 'formula': p.get('MolecularFormula'), 'massa': float(p.get('MolecularWeight', 0)),
            'iupac': p.get('IUPACName'), 'smiles': p.get('CanonicalSMILES') or p.get('ConnectivitySMILES')}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')  # senão o navegador mostra versão velha do jogo
        super().end_headers()

    def do_GET(self):
        if not self.path.startswith('/api/molecule/'):
            return super().do_GET()
        nome = urllib.parse.unquote(self.path[len('/api/molecule/'):])
        try:
            status, corpo = 200, molecula(nome)
        except Exception as e:
            status, corpo = 404, {'erro': str(e)}
        dados = json.dumps(corpo).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)


if __name__ == '__main__':
    pasta = os.path.dirname(os.path.abspath(__file__))
    print('Jogo rodando em http://localhost:8000')
    ThreadingHTTPServer(('', 8000), partial(Handler, directory=pasta)).serve_forever()
