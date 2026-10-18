import { expect, Page } from '@playwright/test';

export class ConfirmacionPage {
  constructor(private readonly page: Page) {}

  private get confirmar() { return this.page.getByRole('button', { name: 'Confirmar compra' }); }
  private get cancelar() { return this.page.getByRole('button', { name: 'Cancelar' }); }
  private get pedido() { return this.page.getByText('Número de pedido:').getByRole('strong'); }

  private get descuentoValor() { return this.page.locator('[data-test="descuento"]'); }
  private get envioValor() { return this.page.locator('[data-test="envio"]'); }
  private get totalValor() { return this.page.locator('[data-test="total"]'); }

  async esperarResumen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/resumen/);
  }

  async descuento(): Promise<string> {
    return (await this.descuentoValor.textContent())?.trim() ?? '';
  }

  async porcentajeDescuento(): Promise<string> {
    return (await this.page.locator('[data-test="descuento-pct"]').textContent())?.trim() ?? '';
  }

  async envio(): Promise<string> {
    return (await this.envioValor.textContent())?.trim() ?? '';
  }

  async total(): Promise<string> {
    return (await this.totalValor.textContent())?.trim() ?? '';
  }

  async confirmarCompra(): Promise<void> {
    await this.confirmar.click();
  }

  async cancelarCompra(): Promise<void> {
    await this.cancelar.click();
  }

  async esperarConfirmacion(): Promise<void> {
    await expect(this.page).toHaveURL(/\/confirmacion/);
  }

  async numeroPedido(): Promise<string> {
    return (await this.pedido.textContent())?.trim() ?? '';
  }
}
