// Paleta de cores usada nos gráficos. Foi validada para que cores
// vizinhas sejam distinguíveis mesmo para pessoas com daltonismo
// (veja a skill de dataviz do projeto). Se quiser trocar as cores,
// troque os valores aqui — mas evite tons muito parecidos entre si.
export const PALETA_CATEGORIAS = [
  '#4f7a2e', // verde-oliva
  '#c1704e', // terracota
  '#b8860b', // mostarda
  '#9c4a68', // vinho
  '#2f7bb8', // azul
  '#9c5e28', // marrom
  '#1f8f7a', // verde-azulado
  '#a34a3a', // vermelho-tijolo
]

/** Cor sugerida para a próxima categoria criada, cicla pela paleta acima. */
export function proximaCorSugerida(quantidadeCategoriasExistentes: number): string {
  return PALETA_CATEGORIAS[quantidadeCategoriasExistentes % PALETA_CATEGORIAS.length]
}

/** Cor de reserva para um item sem cor definida (ex: dado antigo). */
export function corDeReserva(indice: number): string {
  return PALETA_CATEGORIAS[indice % PALETA_CATEGORIAS.length]
}
