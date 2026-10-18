import { expect, Page } from '@playwright/test';

export class IndexPage {
  constructor(private readonly page: Page) {}

  private get usuario() { return this.page.getByLabel('Usuario'); }
  private get clave() { return this.page.getByLabel('Contraseña'); }
  private get ingresar() { return this.page.getByRole('button', { name: 'Ingresar' }); }
  private get error() { return this.page.getByRole('alert'); }

  async abrir(): Promise<void> {
    await this.page.goto('/');
  }

  async ingresarComo(usuario: string, clave = 'calidad2026'): Promise<void> {
    await this.usuario.fill(usuario);
    await this.clave.fill(clave);
    await this.ingresar.click();
  }

  async mensajeError(): Promise<string> {
    return (await this.error.textContent())?.trim() ?? '';
  }

  async verificarEnIngreso(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(?:index\.html)?(?:\?sesion)?$/);
  }
}
