#!/usr/bin/env node
/**
 * GERAR-MINIATURAS.JS — reduz o peso das fotos da landing
 * -------------------------------------------------------
 * Rode na pasta do projeto:   node gerar-miniaturas.js
 *
 * Por que existe: a grade da galeria mostra quadrados de ~300px, mas baixava os
 * arquivos originais de 2000px — 8,05 MB numa unica visita. Num 4G do interior
 * isso e mais de 40 segundos e quase 1% de um pacote de 1 GB, por visita.
 *
 * O que faz: para cada foto listada em galleryFiles (dentro da landing.html),
 * grava uma miniatura de 640x480 em fotos-mini/. O ORIGINAL continua intacto e
 * e o que abre quando a pessoa amplia a foto.
 *
 * Quando rodar: sempre que adicionar ou trocar uma foto da galeria.
 * O validar.js REPROVA a publicacao se faltar miniatura para alguma foto.
 *
 * Dependencia: a biblioteca jimp, que vive em _propostas/node_modules (fora do
 * versionamento). Se a pasta nao existir:  npm install jimp
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const LARGURA = 900, ALTURA = 675, QUALIDADE = 62;

let Jimp;
try { ({ Jimp } = require(path.join(DIR, '_propostas', 'node_modules', 'jimp'))); }
catch (e) { try { ({ Jimp } = require('jimp')); } catch (e2) {
    console.log('Nao achei a biblioteca jimp. Rode:  npm install jimp'); process.exit(1);
} }

const fotosDaGaleria = () => {
    const html = fs.readFileSync(path.join(DIR, 'landing.html'), 'utf8');
    const ini = html.indexOf('galleryFiles');
    const fim = html.indexOf('];', ini);
    if (ini < 0 || fim < 0) { console.log('Nao achei a lista galleryFiles na landing.html'); process.exit(1); }
    return [...new Set([...html.slice(ini, fim).matchAll(/src: *'([^']+)'/g)].map(m => m[1]))];
};

(async () => {
    const destino = path.join(DIR, 'fotos-mini');
    if (!fs.existsSync(destino)) fs.mkdirSync(destino);
    const fotos = fotosDaGaleria();
    let antes = 0, depois = 0, faltando = [];
    console.log(`\nGerando ${fotos.length} miniaturas (${LARGURA}x${ALTURA}, qualidade ${QUALIDADE})\n`);
    for (const f of fotos) {
        const orig = path.join(DIR, f);
        if (!fs.existsSync(orig)) { faltando.push(f); console.log('  ! nao achei ' + f); continue; }
        const im = await Jimp.read(orig);
        const buf = await im.cover({ w: LARGURA, h: ALTURA }).getBuffer('image/jpeg', { quality: QUALIDADE });
        fs.writeFileSync(path.join(destino, f.replace(/[.](jpeg|png)$/i, '.jpg')), buf);
        const a = fs.statSync(orig).size;
        antes += a; depois += buf.length;
        console.log('  ' + f.padEnd(28) + Math.round(a / 1024).toString().padStart(5) + ' KB  ->  ' + Math.round(buf.length / 1024).toString().padStart(4) + ' KB');
    }
    console.log('\n  ' + (antes / 1048576).toFixed(2) + ' MB  ->  ' + (depois / 1048576).toFixed(2) + ' MB   (-' + Math.round((1 - depois / antes) * 100) + '%)\n');
    if (faltando.length) { console.log('FALTOU o arquivo original de: ' + faltando.join(', ') + '\n'); process.exit(1); }
})().catch(e => { console.log('ERRO: ' + e.message); process.exit(1); });
