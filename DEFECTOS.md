# Defectos encontrados

Cada línea corresponde a un defecto reproducible por una prueba roja; la tienda no fue modificada.

- Cupón / envío gratis: iniciar sesión como `estandar`, agregar Taza de barro, ir al checkout, usar `  envioGratis  ` y código postal `02000`; esperado: envío `Q0.00` porque `ENVIOGRATIS` es válido para cualquier código postal; obtenido: `Q40.00`, el cupón solo libera el envío cuando el código postal empieza por `01` (`Cupón: ENVIOGRATIS ignora mayúsculas y espacios y aplica a cualquier CP`).
- Descuento en el límite Q500: iniciar sesión como `estandar`, agregar Molino manual y dos unidades de Café de Huehuetenango 250 g, completar código postal `02000`; esperado: 10 %, descuento `Q50.00` y total `Q490.00`; obtenido: 5 %, descuento `Q25.00` y total `Q515.00` (`Descuento: subtotal exactamente Q500`).
- Ordenamiento por precio para `problema`: iniciar sesión como `problema` y seleccionar “Precio (menor a mayor)”; esperado: `25, 60, 75, 140, 225, 350`; obtenido: `75, 140, 60, 225, 350, 25`, el catálogo conserva el orden por nombre (`Catálogo: ordenar por precio funciona para cualquier usuario`).
- Identidad del producto para `problema`: iniciar sesión como `problema`, agregar Taza de barro y abrir el carrito; esperado: línea “Taza de barro”; obtenido: línea “Filtros de papel (100)” (`Carrito: cada producto conserva su identidad`).
- Apellido en checkout para `problema`: iniciar sesión como `problema`, agregar Taza de barro, completar nombre `Ana`, apellido `Pérez` y código postal `02000`; esperado: avanzar al resumen sin error; obtenido: `Falta el apellido.` (`Datos de envío: apellido obligatorio también para problema`).
