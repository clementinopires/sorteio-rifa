# Sorteio de Rifa Online

Ferramenta web gratuita para realizar sorteios de rifa importando planilhas **Excel** (`.xlsx`, `.xls`) ou **CSV**. Tudo roda no navegador — nenhum dado é enviado a servidores.

## Funcionalidades

- Upload de planilha Excel ou CSV
- Leitura automática das colunas: Número, Comprador e Contato
- Listagem com estatísticas (total, vendidos, disponíveis)
- Sorteio com animação e resultado do ganhador
- Mascaramento parcial de telefone na exibição
- Sorteio com gerador criptográfico (`crypto.getRandomValues`)
- Modelo Excel para download
- Aviso de privacidade (LGPD)
- SEO otimizado para buscadores

## Como usar

1. Abra o site no navegador
2. Leia e aceite o aviso de privacidade
3. Faça upload da planilha ou baixe o [modelo Excel](modelo-rifa.xlsx)
4. Confira a listagem de números
5. Clique em **Sortear** e aguarde a animação

### Formato da planilha

| Numeros | Comprador      | Nº para contato |
|---------|----------------|-----------------|
| 1       | Maria Silva    | 51999887766     |
| 2       |                |                 |
| 3       | João Santos    | 51988776655     |

- Deixe **Comprador** e **Contato** em branco para números ainda não vendidos
- Não altere os nomes das colunas na linha de cabeçalho

## Executar localmente

```bash
# Python 3
python -m http.server 8080
```

Acesse `http://localhost:8080`

## Deploy no Cloudflare Pages

1. Conecte este repositório no [Cloudflare Pages](https://pages.cloudflare.com/)
2. **Build command:** deixe vazio
3. **Build output directory:** `/` (raiz)
4. O arquivo `_headers` aplica automaticamente os headers de segurança

### Arquivos publicados

```
index.html
app.js
style.css
modelo-rifa.xlsx
_headers
robots.txt
sitemap.xml
vendor/xlsx.full.min.js
```

> **Não publique** planilhas com dados reais de participantes.

### Após o deploy

Atualize a URL do seu domínio em:

- `index.html` — `canonical` e `og:url`
- `robots.txt` — sitemap
- `sitemap.xml` — loc

## Segurança e privacidade

- Processamento 100% client-side (sem backend)
- Validação de tipo e tamanho de arquivo (máx. 5 MB)
- Proteção contra XSS na renderização da tabela
- Headers de segurança via `_headers` (CSP, HSTS, X-Frame-Options)
- SheetJS hospedado localmente em `vendor/`

## Tecnologias

- HTML, CSS e JavaScript vanilla
- [SheetJS](https://sheetjs.com/) 0.20.3 (leitura de planilhas)
- Cloudflare Pages (hospedagem recomendada)

## Licença

Uso livre para fins pessoais e beneficentes.
