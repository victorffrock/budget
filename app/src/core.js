(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BudgetCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseBRLNumber(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;

    var input = String(value).replace(/\u00a0/g, ' ').trim();
    if (!input) return null;

    input = input.replace(/^R\$\s*/i, '').trim();

    var formatted = /^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/;
    var unformatted = /^\d+(?:,\d{1,2})?$/;
    if (!formatted.test(input) && !unformatted.test(input)) return null;

    var normalized = input.replace(/\./g, '').replace(',', '.');
    var amount = Number(normalized);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  }

  function calculateRemainingBalance(availableAmount, billsTotal) {
    if (!Number.isFinite(availableAmount) || !Number.isFinite(billsTotal)) return null;
    if (availableAmount < 0 || billsTotal < 0) return null;

    return Math.round((availableAmount - billsTotal) * 100) / 100;
  }

  function normalizeText(text) {
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function extractFromText(fullText) {
    var result = { amount: null, confidence: 'err', due: null };
    var norm = normalizeText(fullText);
    var numPattern = '(?<!\\d)(\\d{1,3}(?:\\.\\d{3})*,\\d{2})(?!\\d)';
    var gap = '[^0-9a-zà-ú]{0,12}(?:r\\$[^0-9a-zà-ú]{0,12})?';

    var rules = [
      { score: 100, re: new RegExp('valor\\s*a\\s*pagar' + gap + numPattern, 'i') },
      { score: 98, re: new RegExp('total\\s*a\\s*pagar' + gap + numPattern, 'i') },
      { score: 96, re: new RegExp('valor\\s*cobrado' + gap + numPattern, 'i') },
      { score: 94, re: new RegExp('pagamento\\s*total\\s*da\\s*fatura' + gap + numPattern, 'i') },
      { score: 92, re: new RegExp('valor\\s*total\\s*da\\s*fatura' + gap + numPattern, 'i') },
      { score: 90, re: new RegExp('total\\s*da\\s*fatura' + gap + numPattern, 'i') },
      { score: 88, re: new RegExp('total\\s*desta\\s*fatura' + gap + numPattern, 'i') },
      { score: 80, re: new RegExp('valor\\s*total' + gap + numPattern, 'i') },
      { score: 78, re: new RegExp('total\\s*geral' + gap + numPattern, 'i') },
      { score: 65, re: new RegExp('valor\\s*do\\s*documento' + gap + numPattern, 'i') },
      { score: 50, re: new RegExp('^\\s*valor' + gap + numPattern, 'im') }
    ];

    var candidates = [];
    var hasConflictingBestCandidates = false;
    for (var i = 0; i < rules.length; i++) {
      var flags = rules[i].re.multiline ? 'gim' : 'gi';
      var matcher = new RegExp(rules[i].re.source, flags);
      var match;

      while ((match = matcher.exec(norm)) !== null) {
        var amount = parseBRLNumber(match[1]);
        if (amount !== null) candidates.push({ amount: amount, score: rules[i].score });
      }
    }

    if (candidates.length) {
      candidates.sort(function (a, b) { return b.score - a.score; });
      var best = candidates[0];
      var tied = candidates.filter(function (candidate) { return candidate.score === best.score; });
      var distinctTied = {};
      tied.forEach(function (candidate) { distinctTied[candidate.amount.toFixed(2)] = true; });

      if (Object.keys(distinctTied).length === 1) {
        result.amount = best.amount;
        result.confidence = best.score >= 90 ? 'ok' : 'warn';
      } else {
        hasConflictingBestCandidates = true;
      }
    }

    if (result.amount === null && !hasConflictingBestCandidates) {
      var all = norm.match(new RegExp(numPattern, 'g')) || [];
      var unique = {};
      all.forEach(function (candidate) {
        var amount = parseBRLNumber(candidate);
        if (amount !== null && amount >= 1) unique[amount.toFixed(2)] = amount;
      });

      var keys = Object.keys(unique);
      if (keys.length === 1) {
        result.amount = unique[keys[0]];
        result.confidence = 'warn';
      } else if (keys.length > 1) {
        var sorted = keys.map(function (key) { return unique[key]; }).sort(function (a, b) { return b - a; });
        if (sorted[0] > sorted[1] * 1.5) {
          result.amount = sorted[0];
          result.confidence = 'warn';
        }
      }
    }

    var dueMatch = norm.match(/vencimento[^0-9]{0,15}(\d{2}\/\d{2}\/\d{4})/i);
    if (dueMatch) result.due = dueMatch[1];

    return result;
  }

  function shouldUseOcr(result) {
    return !result || result.amount === null;
  }

  function extractFromOcrText(fullText) {
    var result = extractFromText(fullText);
    // OCR pode confundir caracteres parecidos, como 0/O e 1/I. Mesmo quando
    // encontra um rótulo conhecido, o valor precisa de uma conferência humana.
    if (result.amount !== null) result.confidence = 'warn';
    return result;
  }

  return Object.freeze({
    calculateRemainingBalance: calculateRemainingBalance,
    extractFromOcrText: extractFromOcrText,
    extractFromText: extractFromText,
    normalizeText: normalizeText,
    parseBRLNumber: parseBRLNumber,
    shouldUseOcr: shouldUseOcr
  });
});
