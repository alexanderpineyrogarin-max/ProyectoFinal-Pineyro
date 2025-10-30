// app.js — lógica del cotizador
// ✅ Sin DOMContentLoaded: usamos 'defer' en index.html para garantizar que el DOM exista

/************ Datos simulados (carga asíncrona sin consultas externas) ************/
function obtenerDestinosRemotos() {
  // Simulamos un fetch remoto para cumplir la consigna de 'datos remotos'
  // y evitamos archivos .json locales que generaron problemas.
  const destinos = [
    {
      id: 'punta-cana',
      nombre: 'Punta Cana',
      baseNoche: 65, // USD por persona
      impuestos: 0.18,
      upgrades: { 'desayuno': 8, 'all-inclusive': 35 }
    },
    {
      id: 'rio-de-janeiro',
      nombre: 'Río de Janeiro',
      baseNoche: 55,
      impuestos: 0.16,
      upgrades: { 'desayuno': 6, 'all-inclusive': 28 }
    },
    {
      id: 'cancun',
      nombre: 'Cancún',
      baseNoche: 70,
      impuestos: 0.19,
      upgrades: { 'desayuno': 9, 'all-inclusive': 38 }
    }
  ];

  return new Promise((resolve) => setTimeout(() => resolve(destinos), 400));
}

/************ Estado y utilidades ************/
const state = {
  destinos: [],
  carrito: cargarDesdeStorage('carrito') ?? [],
  cliente: cargarDesdeStorage('cliente') ?? { nombre: 'Alexander', email: 'alex@demo.com' }
};

function guardarEnStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function cargarDesdeStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function formatearMoneda(num) {
  return '$ ' + Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 }).format(num);
}

/************ Render ************/
const selectDestino = document.getElementById('destino');
const resultados = document.getElementById('resultados');
const drawer = document.getElementById('cartDrawer');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const closeCart = document.getElementById('closeCart');
const navCart = document.getElementById('navCart');

function renderOpcionesDestinos() {
  selectDestino.innerHTML = state.destinos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
}

function crearTarjetaResultado(cotizacion) {
  const div = document.createElement('div');
  div.className = 'result-card';
  div.innerHTML = `
    <h3>${cotizacion.titulo}</h3>
    <div class="small">${cotizacion.detalle}</div>
    <div class="price">${formatearMoneda(cotizacion.total)}</div>
    <div class="actions">
      <button class="btn btn-light" data-action="ver">Detalles</button>
      <button class="btn" data-action="add">Agregar</button>
    </div>
  `;
  div.querySelector('[data-action="ver"]').addEventListener('click', () => {
    Ui.modalConfirm({
      title: 'Detalle de cotización',
      html: `<p>${cotizacion.detalle}</p><p><strong>Total:</strong> ${formatearMoneda(cotizacion.total)}</p>`
    });
  });
  div.querySelector('[data-action="add"]').addEventListener('click', () => {
    agregarAlCarrito(cotizacion);
    Ui.toast('Agregado al carrito');
  });
  return div;
}

function renderResultados(lista) {
  resultados.innerHTML = '';
  lista.forEach(item => resultados.appendChild(crearTarjetaResultado(item)));
}

function renderCarrito() {
  cartItems.innerHTML = '';
  let total = 0;
  state.carrito.forEach(item => {
    total += item.total;
    const li = document.createElement('div');
    li.className = 'cart-item';
    li.innerHTML = `
      <div>
        <strong>${item.titulo}</strong>
        <div class="meta">${item.detalle}</div>
      </div>
      <div>
        <div>${formatearMoneda(item.total)}</div>
        <button class="icon-btn" data-id="${item.id}">Eliminar</button>
      </div>
    `;
    li.querySelector('button').addEventListener('click', async (e) => {
      const ok = await Ui.modalConfirm({ title: 'Quitar del carrito', html: '¿Deseas eliminar este ítem?' });
      if (ok) {
        eliminarDelCarrito(e.target.dataset.id);
        Ui.toast('Eliminado');
      }
    });
    cartItems.appendChild(li);
  });
  cartTotal.textContent = formatearMoneda(total);
}

/************ Lógica de negocio ************/
function calcularCotizacion({ destinoId, salida, adultos, menores, noches, regimen, codigo }) {
  const destino = state.destinos.find(d => d.id === destinoId);
  if (!destino) throw new Error('Destino inválido');

  const pax = Number(adultos) + Number(menores) * 0.6; // menores pagan 60%
  const upgrade = destino.upgrades[regimen] ?? 0;
  const subtotal = (destino.baseNoche + upgrade) * pax * Number(noches);
  const impuestos = subtotal * destino.impuestos;
  let total = subtotal + impuestos;

  const cod = (codigo || '').trim().toUpperCase();
  if (cod === 'VIAJA10') total *= 0.9;
  if (cod === 'BLACK15') total *= 0.85;

  const titulo = `${destino.nombre} · ${noches} noches (${regimen.replace('-', ' ')})`;
  const detalle = `${Number(adultos)} adu · ${Number(menores)} men · salida ${salida || '—'}`;

  return {
    id: `${destinoId}-${Date.now()}`,
    destinoId, titulo, detalle, total: Math.round(total)
  };
}

function agregarAlCarrito(item) {
  state.carrito.push(item);
  guardarEnStorage('carrito', state.carrito);
  renderCarrito();
  abrirCarrito();
}
function eliminarDelCarrito(id) {
  state.carrito = state.carrito.filter(x => x.id !== id);
  guardarEnStorage('carrito', state.carrito);
  renderCarrito();
}
function abrirCarrito(){ drawer.classList.add('open'); }
function cerrarCarrito(){ drawer.classList.remove('open'); }

/************ Eventos ************/
document.getElementById('navHome').addEventListener('click', e => e.preventDefault());
navCart.addEventListener('click', (e) => { e.preventDefault(); abrirCarrito(); });
closeCart.addEventListener('click', cerrarCarrito);

const form = document.getElementById('quoteForm');
// Precarga de datos del cliente en inputs para cumplir consigna
document.getElementById('nombre').value = state.cliente.nombre ?? '';
document.getElementById('email').value = state.cliente.email ?? '';

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  // Guardamos cliente
  state.cliente = { nombre: data.nombre, email: data.email };
  guardarEnStorage('cliente', state.cliente);

  const cot = calcularCotizacion({
    destinoId: data.destino,
    salida: data.salida,
    adultos: data.adultos,
    menores: data.menores,
    noches: data.noches,
    regimen: data.regimen,
    codigo: data.codigo
  });

  renderResultados([cot]);
});

document.getElementById('checkoutBtn').addEventListener('click', async () => {
  if (state.carrito.length === 0) return Ui.toast('El carrito está vacío');
  const ok = await Ui.modalConfirm({
    title: 'Finalizar compra',
    html: 'Simularemos el pago y vaciaremos el carrito. ¿Deseas continuar?'
  });
  if (ok) {
    state.carrito = [];
    guardarEnStorage('carrito', state.carrito);
    renderCarrito();
    Ui.toast('Compra simulada con éxito ✅');
  }
});

/************ Inicialización ************/
(async function init(){
  state.destinos = await obtenerDestinosRemotos();
  renderOpcionesDestinos();
  renderCarrito();
})();
