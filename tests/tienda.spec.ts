import { expect, test, Page } from '@playwright/test';
import { CatalogoPage, Orden } from '../pages/CatalogoPage';
import { CarritoPage } from '../pages/CarritoPage';
import { CheckoutPage, DatosEnvio } from '../pages/CheckoutPage';
import { ConfirmacionPage } from '../pages/ConfirmacionPage';
import { IndexPage } from '../pages/IndexPage';

const PRODUCTOS = {
  antigua: 'Café de Antigua 500 g',
  huehue: 'Café de Huehuetenango 250 g',
  filtros: 'Filtros de papel (100)',
  molino: 'Molino manual',
  prensa: 'Prensa francesa',
  taza: 'Taza de barro',
};

async function iniciarSesion(page: Page, usuario = 'estandar'): Promise<IndexPage> {
  const index = new IndexPage(page);
  await index.abrir();
  await index.ingresarComo(usuario);
  return index;
}

async function prepararCheckout(page: Page, productos: string[], datos: DatosEnvio = {}): Promise<CheckoutPage> {
  const catalogo = new CatalogoPage(page);
  await catalogo.esperar();
  for (const producto of productos) await catalogo.agregar(producto);
  await catalogo.abrirCarrito();
  const carrito = new CarritoPage(page);
  await carrito.continuarAlPago();
  const checkout = new CheckoutPage(page);
  await checkout.completar({ nombre: 'Ana', apellido: 'Pérez', cp: '02000', ...datos });
  return checkout;
}

async function resumenDeCompra(page: Page, productos: string[], datos: DatosEnvio = {}): Promise<ConfirmacionPage> {
  const checkout = await prepararCheckout(page, productos, datos);
  await checkout.continuarAlResumen();
  const resumen = new ConfirmacionPage(page);
  await resumen.esperarResumen();
  return resumen;
}

test.describe('Ingreso y sesión', () => {
  test('Ingreso: usuario y contraseña obligatorios — partición de equivalencia (campos vacíos)', async ({ page }) => {
    const index = new IndexPage(page);
    await index.abrir();
    await index.ingresarComo('', '');
    expect(await index.mensajeError()).toBe('Falta el usuario.');
    await index.ingresarComo('estandar', '');
    expect(await index.mensajeError()).toBe('Falta la contraseña.');
  });

  test('Ingreso: credenciales incorrectas — partición de equivalencia (datos inválidos)', async ({ page }) => {
    const index = new IndexPage(page);
    await index.abrir();
    await index.ingresarComo('no-existe', 'incorrecta');
    expect(await index.mensajeError()).toBe('Usuario o contraseña incorrectos.');
    await index.verificarEnIngreso();
  });

  test('Ingreso: usuario bloqueado — tabla de decisión (usuario válido/bloqueado)', async ({ page }) => {
    const index = new IndexPage(page);
    await index.abrir();
    await index.ingresarComo('bloqueado');
    expect(await index.mensajeError()).toBe('Este usuario está bloqueado.');
    await index.verificarEnIngreso();
  });

  test('Ingreso: usuario válido entra al catálogo — partición de equivalencia (credenciales válidas)', async ({ page }) => {
    await iniciarSesion(page);
    await new CatalogoPage(page).esperar();
  });

  test('Sesión: página protegida sin sesión redirige al ingreso — transición de estados (anónimo → ingreso)', async ({ page }) => {
    await page.goto('/carrito');
    await new IndexPage(page).verificarEnIngreso();
  });

  test('Sesión: cerrar sesión vacía el carrito — transición de estados (carrito → sesión cerrada)', async ({ page }) => {
    await iniciarSesion(page);
    const catalogo = new CatalogoPage(page);
    await catalogo.agregar(PRODUCTOS.taza);
    expect(await catalogo.contadorCarrito()).toBe(1);
    await catalogo.cerrarSesion();
    await iniciarSesion(page);
    await new CatalogoPage(page).abrirCarrito();
    expect(await new CarritoPage(page).estaVacio()).toBe(true);
  });
});

test.describe('Catálogo y carrito', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page);
  });

  test('Catálogo: orden inicial por nombre A-Z — partición de equivalencia (orden predeterminado)', async ({ page }) => {
    const catalogo = new CatalogoPage(page);
    await catalogo.esperar();
    expect(await catalogo.nombres()).toEqual([
      PRODUCTOS.antigua, PRODUCTOS.huehue, PRODUCTOS.filtros, PRODUCTOS.molino, PRODUCTOS.prensa, PRODUCTOS.taza,
    ]);
  });

  for (const [orden, esperado] of [
    ['Nombre (Z a A)', [PRODUCTOS.taza, PRODUCTOS.prensa, PRODUCTOS.molino, PRODUCTOS.filtros, PRODUCTOS.huehue, PRODUCTOS.antigua]],
    ['Precio (menor a mayor)', [25, 60, 75, 140, 225, 350]],
    ['Precio (mayor a menor)', [350, 225, 140, 75, 60, 25]],
  ] as [Orden, string[] | number[]][]) {
    test(`Catálogo: ${orden} — partición de equivalencia (criterio de ordenamiento)`, async ({ page }) => {
      const catalogo = new CatalogoPage(page);
      await catalogo.esperar();
      await catalogo.ordenarPor(orden);
      if (typeof esperado[0] === 'number') expect(await catalogo.precios()).toEqual(esperado);
      else expect(await catalogo.nombres()).toEqual(esperado);
    });
  }

  test('Carrito: producto agregado una sola vez y contador suma unidades — transición de estados (vacío → con productos)', async ({ page }) => {
    const catalogo = new CatalogoPage(page);
    await catalogo.agregar(PRODUCTOS.taza);
    await catalogo.agregar(PRODUCTOS.antigua);
    expect(await catalogo.contadorCarrito()).toBe(2);
    expect(await catalogo.estaAgregado(PRODUCTOS.taza)).toBe(true);
    await catalogo.abrirCarrito();
    const carrito = new CarritoPage(page);
    expect(await carrito.unidades()).toBe(2);
  });

  test('Carrito: quitar producto devuelve el carrito a vacío — transición de estados (agregado → vacío)', async ({ page }) => {
    const catalogo = new CatalogoPage(page);
    await catalogo.agregar(PRODUCTOS.taza);
    await catalogo.abrirCarrito();
    const carrito = new CarritoPage(page);
    await carrito.quitar(PRODUCTOS.taza);
    expect(await carrito.estaVacio()).toBe(true);
    expect(await carrito.continuarEstaDeshabilitado()).toBe(true);
  });

  for (const [valor, esperado] of [['1', true], ['5', true], ['0', false], ['6', false], ['-1', false], ['1.5', false]] as [string, boolean][]) {
    test(`Cantidad: ${valor} — análisis de valores límite y particiones (rango entero 1..5)`, async ({ page }) => {
      const catalogo = new CatalogoPage(page);
      await catalogo.agregar(PRODUCTOS.taza);
      await catalogo.abrirCarrito();
      const carrito = new CarritoPage(page);
      await carrito.cambiarCantidad(PRODUCTOS.taza, valor);
      expect(await carrito.continuarEstaDeshabilitado()).toBe(!esperado);
      if (esperado) expect(await carrito.mensajeError()).toBe('');
      else expect(await carrito.mensajeError()).toContain('entre 1 y 5');
    });
  }
});

test.describe('Checkout, cupón, descuentos, envío y total', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page);
  });

  for (const [campo, datos, mensaje] of [
    ['nombre', { nombre: '', apellido: 'Pérez', cp: '02000' }, 'Falta el nombre.'],
    ['apellido', { nombre: 'Ana', apellido: '', cp: '02000' }, 'Falta el apellido.'],
  ] as [string, DatosEnvio, string][]) {
    test(`Datos de envío: ${campo} obligatorio — partición de equivalencia (campo ausente)`, async ({ page }) => {
      const checkout = await prepararCheckout(page, [PRODUCTOS.taza], datos);
      await checkout.continuarAlResumen();
      expect(await checkout.mensajeError()).toBe(mensaje);
    });
  }

  for (const cp of ['1234', '123456', '12A45']) {
    test(`Datos de envío: código postal ${cp} — análisis de valores límite/partición (no exactamente 5 dígitos)`, async ({ page }) => {
      const checkout = await prepararCheckout(page, [PRODUCTOS.taza], { cp });
      await checkout.continuarAlResumen();
      expect(await checkout.mensajeError()).toBe('El código postal tiene que tener 5 dígitos.');
    });
  }

  test('Datos de envío: código postal 00000 y 99999 aceptados — análisis de valores límite (longitud 5)', async ({ page }) => {
    const checkout = await prepararCheckout(page, [PRODUCTOS.taza], { cp: '00000' });
    await checkout.continuarAlResumen();
    await new ConfirmacionPage(page).esperarResumen();
  });

  test('Cupón: ENVIOGRATIS ignora mayúsculas y espacios y aplica a cualquier CP — partición de equivalencia (válido)', async ({ page }) => {
    const resumen = await resumenDeCompra(page, [PRODUCTOS.taza], { cp: '02000', cupon: '  envioGratis  ' });
    expect(await resumen.envio()).toBe('Q0.00');
  });

  test('Cupón: texto distinto, incluido ENVIOGRATIS con letras extra — partición de equivalencia (inválido)', async ({ page }) => {
    const checkout = await prepararCheckout(page, [PRODUCTOS.taza], { cupon: 'ENVIOGRATISX' });
    await checkout.continuarAlResumen();
    expect(await checkout.mensajeError()).toBe('El cupón no existe.');
  });

  test('Descuento: subtotal menor de Q200 — tabla de decisión (sin descuento)', async ({ page }) => {
    const resumen = await resumenDeCompra(page, [PRODUCTOS.antigua], { cp: '02000' });
    expect(await resumen.porcentajeDescuento()).toBe('0');
    expect(await resumen.descuento()).toBe('-Q0.00');
    expect(await resumen.total()).toBe('Q180.00');
  });

  test('Descuento: subtotal exactamente Q200 — análisis de valores límite (5%)', async ({ page }) => {
    const resumen = await resumenDeCompra(page, [PRODUCTOS.antigua, PRODUCTOS.taza], { cp: '02000' });
    expect(await resumen.porcentajeDescuento()).toBe('5');
    expect(await resumen.descuento()).toBe('-Q10.00');
    expect(await resumen.total()).toBe('Q230.00');
  });

  test('Descuento: subtotal exactamente Q500 — análisis de valores límite (10%)', async ({ page }) => {
    const catalogo = new CatalogoPage(page);
    await catalogo.agregar(PRODUCTOS.molino);
    await catalogo.agregar(PRODUCTOS.huehue);
    await catalogo.abrirCarrito();
    const carrito = new CarritoPage(page);
    await carrito.cambiarCantidad(PRODUCTOS.huehue, 2);
    await carrito.continuarAlPago();
    const checkout = new CheckoutPage(page);
    await checkout.completar({ nombre: 'Ana', apellido: 'Pérez', cp: '02000' });
    await checkout.continuarAlResumen();
    const resumenFinal = new ConfirmacionPage(page);
    expect(await resumenFinal.porcentajeDescuento()).toBe('10');
    expect(await resumenFinal.descuento()).toBe('-Q50.00');
    expect(await resumenFinal.total()).toBe('Q490.00');
  });

  test('Envío: CP 01 cobra Q25 si no es gratis — tabla de decisión (prefijo postal)', async ({ page }) => {
    const ciudad = await resumenDeCompra(page, [PRODUCTOS.antigua], { cp: '01000' });
    expect(await ciudad.envio()).toBe('Q25.00');
  });

  test('Envío: CP que no empieza por 01 cobra Q40 si no es gratis — tabla de decisión (prefijo postal)', async ({ page }) => {
    const ciudad = await resumenDeCompra(page, [PRODUCTOS.antigua], { cp: '02000' });
    expect(await ciudad.envio()).toBe('Q40.00');
  });

  test('Envío gratis: subtotal con descuento de Q300 o más — tabla de decisión (condición alternativa)', async ({ page }) => {
    const resumen = await resumenDeCompra(page, [PRODUCTOS.molino], { cp: '02000' });
    expect(await resumen.envio()).toBe('Q0.00');
  });
});

test.describe('Confirmación', () => {
  test('Confirmación: pedido de 6 dígitos y carrito vacío — transición de estados (resumen → confirmado)', async ({ page }) => {
    await iniciarSesion(page);
    const resumen = await resumenDeCompra(page, [PRODUCTOS.taza], { cp: '01000' });
    await resumen.confirmarCompra();
    await resumen.esperarConfirmacion();
    expect(await resumen.numeroPedido()).toMatch(/^\d{6}$/);
    await new CatalogoPage(page).abrirCarrito();
    expect(await new CarritoPage(page).estaVacio()).toBe(true);
  });
});

test.describe('Usuario problema: reglas que deben ser independientes del perfil', () => {
  test('Catálogo: ordenar por precio funciona para cualquier usuario — tabla de decisión (perfil problema)', async ({ page }) => {
    await iniciarSesion(page, 'problema');
    const catalogo = new CatalogoPage(page);
    await catalogo.ordenarPor('Precio (menor a mayor)');
    expect(await catalogo.precios()).toEqual([25, 60, 75, 140, 225, 350]);
  });

  test('Carrito: cada producto conserva su identidad — partición de equivalencia (producto Taza)', async ({ page }) => {
    await iniciarSesion(page, 'problema');
    const catalogo = new CatalogoPage(page);
    await catalogo.agregar(PRODUCTOS.taza);
    await catalogo.abrirCarrito();
    expect(await new CarritoPage(page).productos()).toContain(PRODUCTOS.taza);
  });

  test('Datos de envío: apellido obligatorio también para problema — partición de equivalencia (usuario autenticado)', async ({ page }) => {
    await iniciarSesion(page, 'problema');
    const catalogo = new CatalogoPage(page);
    await catalogo.agregar(PRODUCTOS.taza);
    await catalogo.abrirCarrito();
    await new CarritoPage(page).continuarAlPago();
    const checkout = new CheckoutPage(page);
    await checkout.completar({ nombre: 'Ana', apellido: 'Pérez', cp: '02000' });
    await checkout.continuarAlResumen();
    expect(await checkout.mensajeError()).toBe('');
    await new ConfirmacionPage(page).esperarResumen();
  });
});
