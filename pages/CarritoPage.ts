import { expect, Page } from '@playwright/test';

export class CarritoPage {
  constructor(private readonly page: Page) {}

  private get filas() { return this.page.getByRole('row').filter({ has: this.page.getByRole('spinbutton') }); }
  private get subtotal() { return this.page.getByText(/^Subtotal:/).locator('..').getByRole('strong'); }
  private get error() { return this.page.getByRole('alert'); }
  private get continuar() { return this.page.getByRole('button', { name: 'Continuar al pago' }); }
  private get vacio() { return this.page.getByText('El carrito está vacío.'); }
  private get enlaceCatalogo() { return this.page.getByRole('link', { name: 'Seguir comprando' }); }

  private fila(nombre: string) {
    return this.filas.filter({ hasText: nombre });
  }

  async esperar(): Promise<void> {
    await expect(this.page).toHaveURL(/\/carrito/);
  }

  async cantidad(nombre: string): Promise<number> {
    return Number(await this.fila(nombre).getByRole('spinbutton').inputValue());
  }

  async productos(): Promise<string[]> {
    return this.filas.getByRole('cell').first().allTextContents();
  }

  async cambiarCantidad(nombre: string, cantidad: string | number): Promise<void> {
    const input = this.fila(nombre).getByRole('spinbutton');
    await input.fill(String(cantidad));
    await input.blur();
  }

  async mensajeError(): Promise<string> {
    return (await this.error.textContent())?.trim() ?? '';
  }

  async subtotalTexto(): Promise<string> {
    return (await this.subtotal.textContent())?.trim() ?? '';
  }

  async unidades(): Promise<number> {
    return this.filas.count().then(async (filas) => {
      let total = 0;
      for (let i = 0; i < filas; i++) total += Number(await this.filas.nth(i).getByRole('spinbutton').inputValue());
      return total;
    });
  }

  async quitar(nombre: string): Promise<void> {
    await this.fila(nombre).getByRole('button', { name: 'Quitar' }).click();
  }

  async continuarAlPago(): Promise<void> {
    await this.continuar.click();
  }

  async continuarEstaDeshabilitado(): Promise<boolean> {
    return this.continuar.isDisabled();
  }

  async estaVacio(): Promise<boolean> {
    return this.vacio.isVisible();
  }

  async volverAlCatalogo(): Promise<void> {
    await this.enlaceCatalogo.click();
  }
}
