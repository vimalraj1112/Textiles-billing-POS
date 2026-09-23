const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const toPaise = (value) => {
  if (value === null || value === undefined) return 0;
  return Math.round(Number(value) * 100);
};

const toRupees = (paise) => round((Number(paise) || 0) / 100);

const formatINR = (paise) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(toRupees(paise));

module.exports = {
  round,
  toPaise,
  toRupees,
  formatINR,
};