'use strict';

// VIN (Vehicle Identification Number): 17 caracteres, letras e números,
// sem I, O e Q (para não confundir com 1 e 0).
const PADRAO_VIN = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Normaliza o VIN como chega do leitor de código de barras ou do banco:
 * remove espaços nas pontas e converte para maiúsculas.
 * Sem isso, "9BAXX...  " e "9baxx..." viravam VINs diferentes (ver BUG-001).
 */
function normalizarVin(vin) {
  if (typeof vin !== 'string') return '';
  return vin.trim().toUpperCase();
}

function validarVin(vin) {
  const v = normalizarVin(vin);
  if (v.length === 0) return { valido: false, motivo: 'VIN não informado' };
  if (v.length !== 17) return { valido: false, motivo: 'VIN deve ter 17 caracteres' };
  if (/[IOQ]/.test(v)) return { valido: false, motivo: 'VIN não pode conter as letras I, O ou Q' };
  if (!PADRAO_VIN.test(v)) return { valido: false, motivo: 'VIN contém caracteres inválidos' };
  return { valido: true, vin: v };
}

/**
 * O 4º caractere do VIN identifica a linha do fabricante.
 * 'B' = fabricante ALFA, qualquer outro = fabricante BETA.
 */
function fabricanteDoVin(vin) {
  return normalizarVin(vin).charAt(3) === 'B' ? 'ALFA' : 'BETA';
}

module.exports = { normalizarVin, validarVin, fabricanteDoVin };
