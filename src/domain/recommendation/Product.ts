/**
 * Forma mínima de un producto tal como lo entrega cualquier DataSource. No es
 * el modelo de Producto de OrderFlow ni de ningún otro sistema en particular
 * — es lo que el dominio necesita para decidir, nada más. Un adapter nuevo
 * (otra fuente de datos) solo tiene que poder producir esta forma.
 */
export interface Product {
  id: string;
  name: string;
  price: string;
  unitsSold?: number;
}
