const numbering = {
  CN:['86',/^1[3-9]\d{9}$/], HK:['852',/^[456789]\d{7}$/], MO:['853',/^6\d{7}$/], TW:['886',/^9\d{8}$/,true],
  US:['1',/^[2-9]\d{2}[2-9]\d{6}$/], GB:['44',/^7\d{9}$/,true], AU:['61',/^4\d{8}$/,true], SG:['65',/^[89]\d{7}$/], MY:['60',/^1\d{8,9}$/,true],
  JP:['81',/^[789]0\d{8}$/,true], KR:['82',/^10\d{8}$/,true], IN:['91',/^[6-9]\d{9}$/], DE:['49',/^1[567]\d{8,9}$/,true], FR:['33',/^[67]\d{8}$/,true], AE:['971',/^5[024568]\d{7}$/,true],
};

export function normalizePhone(value, region) {
  const number = String(value ?? '').slice(0, 41).normalize('NFKC').replace(/[\s.()\-]/g,'').replace(/^00/,'+');
  if (number.startsWith('+')) {
    if (!/^\+[1-9]\d{7,14}$/.test(number)) return null;
    const options = Object.values(numbering).filter(([code])=>number.startsWith(`+${code}`));
    return !options.length || options.some(([code,pattern])=>pattern.test(number.slice(code.length+1))) ? number : null;
  }
  const plan = Object.hasOwn(numbering,region) ? numbering[region] : null;
  if (!plan || !/^\d{6,14}$/.test(number)) return null;
  const [code, pattern, dropZero] = plan;
  const local = dropZero ? number.replace(/^0/,'') : code==='1' && number.length===11 ? number.replace(/^1/,'') : number;
  return pattern.test(local) ? `+${code}${local}` : null;
}
