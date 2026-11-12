# TG Telecom — site

Site institucional da TG Telecom (internet fibra óptica). HTML, CSS e JavaScript puros, sem etapa de build.

## Como abrir
Abra o `index.html` no navegador, ou publique a pasta em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel).

## Estrutura
- `index.html`: página. As cores ficam no `:root` do topo e os dados da empresa (WhatsApp, cidade, etc.) no `window.SITE`, no fim do arquivo.
- `assets/site.css`: estilos.
- `assets/site.js`: hero 3D (Three.js), animações (GSAP + ScrollTrigger + Lenis), mapas e formulários.
- `assets/globe-data.js`: pontos do globo e do mapa.
- `assets/img/`: logos e ícones.

## Layout
O layout principal é o branco: a classe `tema-claro` no `<html>` do `index.html` ativa `assets/tema-claro.css`.

## Prova social
Os prints de conversas ficam em `assets/img/depoimentos/`, com foto de perfil e sobrenome borrados. Os prints originais não vão para o repositório.

## Antes de publicar
Telefones, e-mail, endereço, CNPJ, redes sociais e 5 dos 7 cards de depoimento ainda são exemplos e precisam ser trocados pelos reais.
