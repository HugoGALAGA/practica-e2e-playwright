import { expect, Page } from '@playwright/test';

export interface DatosEnvio {
  nombre?: string;
  apellido?: string;
  cp?: string;
  cupon?: string;
}

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  private get nombre() { return this.page.getByLabel('Nombre'); }
  private get apellido() { return this.page.getByLabel('Apellido'); }
  private get cp() { return this.page.getByLabel('Código postal'); }
  private get cupon() { return this.page.getByLabel('Cupón (opcional)'); }
  private get continuar() { return this.page.getByRole('button', { name: 'Continuar' }); }
  private get cancelar() { return this.page.getByRole('button', { name: 'Cancelar' }); }
  private get error() { return this.page.getByRole('alert'); }

  async esperar(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout/);
  }

  async completar(datos: DatosEnvio): Promise<void> {
    if (datos.nombre !== undefined) await this.nombre.fill(datos.nombre);
    if (datos.apellido !== undefined) await this.apellido.fill(datos.apellido);
    if (datos.cp !== undefined) await this.cp.fill(datos.cp);
    if (datos.cupon !== undefined) await this.cupon.fill(datos.cupon);
  }

  async continuarAlResumen(): Promise<void> {
    await this.continuar.click();
  }

  async mensajeError(): Promise<string> {
    return (await this.error.textContent())?.trim() ?? '';
  }

  async cancelarCompra(): Promise<void> {
    await this.cancelar.click();
  }
}
