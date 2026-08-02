import '@testing-library/jest-dom/vitest';

// Radix UI (Select, Dialog) usa estas APIs del DOM que jsdom no implementa;
// sin esto, interactuar con esos componentes en los tests lanza errores.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
