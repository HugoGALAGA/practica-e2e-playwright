import { expect, Page } from '@playwright/test';

export type Orden = 'Nombre (A a Z)' | 'Nombre (Z a A)' | 'Precio (menor a mayor)' | 'Precio (mayor a menor)';

export class CatalogoPage {
  constructor(private readonly page: Page) {}

  private get orden() { return this.page.getByLabel('Ordenar por'); }
  private get productos() { return this.page.getByRole('article'); }
  private get carrito() { return this.page.getByRole('link', { name: /Carrito/ }); }
  private get cerrarSesionButton() { return this.page.getByRole('button', { name: 'Cerrar sesión' }); }

  async esperar(): Promise<void> {
    await expect(this.page).toHaveURL(/\/catalogo/);
    await expect(this.page.getByRole('heading', { name: 'Catálogo' })).toBeVisible();
  }

  private producto(nombre: string) {
    return this.productos.filter({ has: this.page.getByRole('heading', { name: nombre }) });
  }

  async ordenarPor(orden: Orden): Promise<void> {
    await this.orden.selectOption({ label: orden });
  }

  async nombres(): Promise<string[]> {
    return this.productos.getByRole('heading', { level: 2 }).allTextContents();
  }

  async precios(): Promise<number[]> {
    const textos = await this.productos.getByText(/^Q\d+\.\d{2}$/).allTextContents();
    return textos.map((t) => Number(t.replace('Q', '')));
  }

  async agregar(nombre: string): Promise<void> {
    await this.producto(nombre).getByRole('button', { name: 'Agregar al carrito' }).click();
  }

  async estaAgregado(nombre: string): Promise<boolean> {
    return this.producto(nombre).getByRole('button', { name: 'Quitar' }).isVisible().catch(() => false);
  }

  async contadorCarrito(): Promise<number> {
    const texto = await this.carrito.textContent();
    return Number(texto?.match(/\d+/)?.[0] ?? 0);
  }

  async abrirCarrito(): Promise<void> {
    await this.carrito.click();
  }

  async cerrarSesion(): Promise<void> {
    await this.cerrarSesionButton.click();
  }
}
