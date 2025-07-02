// Script principal para el sistema de inventario y pedidos de VF Comercial
// Comentarios agregados para cada bloque y función principal

// --- Funciones de Inventario ---
// Obtiene la lista de productos desde localStorage
function getProducts() {
  return JSON.parse(localStorage.getItem("products") || "[]");
}
// Guarda la lista de productos en localStorage
function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}
let editIndex = null;

// Renderiza la tabla de productos en pantalla
function renderTable() {
  const products = getProducts();
  const search = document.getElementById("search").value.trim().toLowerCase();
  const tbody = document.querySelector("#inventory-table tbody");
  tbody.innerHTML = "";
  products.forEach((product, index) => {
    if (
      !search ||
      product.name.toLowerCase().includes(search) ||
      (product.category && product.category.toLowerCase().includes(search))
    ) {
      const row = document.createElement("tr");
      if (editIndex === index && isAdmin()) {
        row.innerHTML = `
          <td><input type='text' id='edit-name' value='${product.name}' /></td>
          <td><input type='number' id='edit-quantity' value='${
            product.quantity
          }' min='1' /></td>
          <td><input type='text' id='edit-category' value='${
            product.category || ""
          }' /></td>
          <td>
            <button onclick="saveEdit(${index})">Guardar</button>
            <button onclick="cancelEdit()">Cancelar</button>
          </td>
        `;
      } else {
        row.innerHTML = `
          <td>${product.name}</td>
          <td>${product.quantity}</td>
          <td>${product.category || ""}</td>
          <td>
            ${
              isAdmin()
                ? `<button onclick=\"startEdit(${index})\">Editar</button><button onclick=\"deleteProduct(${index})\">Eliminar</button>`
                : ""
            }
          </td>
        `;
      }
      tbody.appendChild(row);
    }
  });
  renderOrderProducts();
}

// Inicia la edición de un producto
function startEdit(index) {
  editIndex = index;
  renderTable();
}
// Cancela la edición de un producto
function cancelEdit() {
  editIndex = null;
  renderTable();
}
// Guarda los cambios de un producto editado
function saveEdit(index) {
  const name = document.getElementById("edit-name").value.trim();
  const quantity = parseInt(document.getElementById("edit-quantity").value);
  const category = document.getElementById("edit-category").value.trim();
  if (name && quantity > 0) {
    const products = getProducts();
    products[index] = { name, quantity, category };
    saveProducts(products);
    editIndex = null;
    renderTable();
  }
}
// Elimina un producto del inventario
function deleteProduct(index) {
  const products = getProducts();
  products.splice(index, 1);
  saveProducts(products);
  renderTable();
}

// --- Eventos de Inventario ---
// Maneja el envío del formulario para agregar productos
const productForm = document.getElementById("product-form");
if (productForm) {
  productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const quantity = parseInt(document.getElementById("quantity").value);
    const category = document.getElementById("category").value.trim();
    if (name && quantity > 0) {
      const products = getProducts();
      products.push({ name, quantity, category });
      saveProducts(products);
      renderTable();
      this.reset();
    }
  });
}
// Filtro de búsqueda en inventario
const searchInput = document.getElementById("search");
if (searchInput) {
  searchInput.addEventListener("input", function () {
    renderTable();
  });
}
// Exporta el inventario a Excel
const exportBtn = document.getElementById("export-excel");
if (exportBtn) {
  exportBtn.addEventListener("click", function () {
    const products = getProducts();
    if (products.length === 0) {
      alert("No hay productos para exportar.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario.xlsx");
  });
}

// --- PEDIDOS DE CLIENTES ---
// Renderiza los productos disponibles en el formulario de pedidos
function renderOrderProducts() {
  const products = getProducts();
  const select = document.getElementById("order-product");
  if (!select) return;
  select.innerHTML = "";
  let hasOptions = false;
  if (Array.isArray(products) && products.length > 0) {
    products.forEach((product, i) => {
      const cantidad = Number(product.quantity);
      if (product && product.name && cantidad > 0 && !isNaN(cantidad)) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent =
          `${product.name} (${cantidad} disponibles)` +
          (product.category ? ` - ${product.category}` : "");
        select.appendChild(option);
        hasOptions = true;
      }
    });
  }
  if (!hasOptions) {
    const option = document.createElement("option");
    option.textContent = "No hay productos disponibles";
    option.disabled = true;
    option.selected = true;
    select.appendChild(option);
    select.disabled = true;
  } else {
    select.disabled = false;
  }
}
// Actualiza el select de productos al cambiar de vista
renderOrderProducts();
document
  .getElementById("btn-ver-pedidos")
  .addEventListener("click", function () {
    setTimeout(renderOrderProducts, 100);
  });
document
  .getElementById("btn-ver-inventario")
  .addEventListener("click", function () {
    setTimeout(renderOrderProducts, 100);
  });

// Maneja el envío del formulario de pedidos
const orderForm = document.getElementById("order-form");
if (orderForm) {
  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const productIndex = parseInt(
      document.getElementById("order-product").value
    );
    const quantity = parseInt(document.getElementById("order-quantity").value);
    const name = document.getElementById("order-name").value.trim();
    const email = document.getElementById("order-email").value.trim();
    const products = getProducts();
    const product = products[productIndex];
    if (!product || quantity < 1 || quantity > product.quantity) {
      alert("Cantidad no válida o producto no disponible.");
      return;
    }
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push({
      product: product.name,
      quantity,
      name,
      email,
      date: new Date().toLocaleString(),
    });
    localStorage.setItem("orders", JSON.stringify(orders));
    product.quantity -= quantity;
    saveProducts(products);
    renderTable();
    document.getElementById("order-form").reset();
    const msg = document.getElementById("order-success");
    msg.textContent =
      "¡Pedido realizado con éxito! Nos pondremos en contacto contigo.";
    msg.style.display = "block";
    setTimeout(() => (msg.style.display = "none"), 4000);
  });
}

// --- Navegación entre apartados ---
// Cambia entre inventario y pedidos
const btnVerPedidos = document.getElementById("btn-ver-pedidos");
const btnVerInventario = document.getElementById("btn-ver-inventario");
const apartadoInventario = document.getElementById("apartado-inventario");
const apartadoPedidos = document.getElementById("apartado-pedidos");
if (
  btnVerPedidos &&
  btnVerInventario &&
  apartadoInventario &&
  apartadoPedidos
) {
  btnVerPedidos.addEventListener("click", function () {
    apartadoInventario.style.display = "none";
    apartadoPedidos.style.display = "block";
    btnVerPedidos.style.display = "none";
    btnVerInventario.style.display = "inline-block";
    if (typeof renderOrderProducts === "function") renderOrderProducts();
  });
  btnVerInventario.addEventListener("click", function () {
    apartadoInventario.style.display = "block";
    apartadoPedidos.style.display = "none";
    btnVerPedidos.style.display = "inline-block";
    btnVerInventario.style.display = "none";
  });
}

// --- Inicialización de la tabla y productos ---
renderTable();
if (window.location.pathname.includes("pedidos.html")) {
  renderOrderProducts();
}

// --- Modo oscuro ---
// Permite alternar entre modo claro y oscuro
const toggleDark = document.getElementById("toggle-dark");
if (toggleDark) {
  // Cargar preferencia previa
  if (localStorage.getItem("vf_darkmode") === "1") {
    document.body.classList.add("dark-mode");
    toggleDark.textContent = "☀️";
  }
  toggleDark.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    toggleDark.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("vf_darkmode", isDark ? "1" : "0");
  });
}

// --- Mostrar/Ocultar formulario y edición de productos solo para admins ---
// Verifica si el usuario es admin
function isAdmin() {
  return localStorage.getItem("vf_admin") === "1";
}
// Muestra u oculta el formulario de productos según el estado admin
function toggleProductForm() {
  var form = document.getElementById("product-form");
  if (form) {
    form.style.display = isAdmin() ? "" : "none";
  }
}
// Muestra u oculta el botón de login admin
function toggleAdminLoginBtn() {
  var adminLoginBtn = document.getElementById("admin-login-btn");
  if (adminLoginBtn) {
    adminLoginBtn.style.display = isAdmin() ? "none" : "block";
  }
}
// Renderiza el botón de salir de admin
function renderLogoutBtn() {
  var logoutBtn = document.getElementById("admin-logout-btn");
  if (isAdmin()) {
    if (!logoutBtn) {
      logoutBtn = document.createElement("button");
      logoutBtn.id = "admin-logout-btn";
      logoutBtn.textContent = "Salir de admin";
      logoutBtn.style.position = "fixed";
      logoutBtn.style.bottom = "24px";
      logoutBtn.style.right = "24px";
      logoutBtn.style.zIndex = "1200";
      logoutBtn.style.background =
        "linear-gradient(90deg,#fbbf24 0%,#fde68a 100%)";
      logoutBtn.style.color = "#7a5a1e";
      logoutBtn.style.border = "none";
      logoutBtn.style.borderRadius = "8px";
      logoutBtn.style.padding = "10px 22px";
      logoutBtn.style.fontSize = "1em";
      logoutBtn.style.fontWeight = "600";
      logoutBtn.style.boxShadow = "0 2px 8px #fbbf2422";
      logoutBtn.style.cursor = "pointer";
      logoutBtn.onclick = function () {
        localStorage.removeItem("vf_admin");
        afterAdminStateChange();
        logoutBtn.style.display = "none";
      };
      document.body.appendChild(logoutBtn);
    } else {
      logoutBtn.style.display = "block";
    }
  } else if (logoutBtn) {
    logoutBtn.style.display = "none";
  }
}
// Actualiza la interfaz al cargar la página o cambiar el estado admin
window.addEventListener("DOMContentLoaded", function () {
  toggleProductForm();
  toggleAdminLoginBtn();
  renderLogoutBtn();
});
window.addEventListener("storage", function () {
  toggleProductForm();
  toggleAdminLoginBtn();
  renderLogoutBtn();
});

// --- Pantalla de login de administrador ---
(function () {
  var loginModal = document.getElementById("login-modal");
  var adminLoginBtn = document.getElementById("admin-login-btn");
  if (adminLoginBtn) {
    adminLoginBtn.onclick = function () {
      if (loginModal) {
        loginModal.style.display = "flex";
        document.body.style.overflow = "hidden";
        var pass = document.getElementById("admin-pass");
        var err = document.getElementById("login-error");
        if (pass) pass.value = "";
        if (err) err.style.display = "none";
        setTimeout(function () {
          if (pass) pass.focus();
        }, 100);
      }
    };
  }
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");
  var cancelBtn = document.getElementById("cancel-admin-login");
  var ADMIN_PASS = "hanler211";
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var pass = document.getElementById("admin-pass").value;
      if (pass === ADMIN_PASS) {
        localStorage.setItem("vf_admin", "1");
        loginModal.style.display = "none";
        document.body.style.overflow = "";
        afterAdminStateChange();
      } else {
        loginError.style.display = "block";
      }
    });
    document
      .getElementById("admin-pass")
      .addEventListener("input", function () {
        loginError.style.display = "none";
      });
  }
  if (cancelBtn) {
    cancelBtn.onclick = function () {
      loginModal.style.display = "none";
      document.body.style.overflow = "";
      var pass = document.getElementById("admin-pass");
      var err = document.getElementById("login-error");
      if (pass) pass.value = "";
      if (err) err.style.display = "none";
    };
  }
})();

// --- Sobre nosotros ---
// Lógica para mostrar/ocultar el apartado 'Sobre nosotros' según el estado admin
const aboutSection = document.getElementById("about-section");
const btnAbout = document.getElementById("btn-about");
const aboutContent = document.getElementById("about-content");
const btnSalirAdmin = document.getElementById("btn-salir-admin");
const btnEntrarAdmin = document.getElementById("btn-entrar-admin");

if (btnAbout) {
  btnAbout.addEventListener("click", () => {
    aboutContent.style.display =
      aboutContent.style.display === "none" ? "block" : "none";
  });
}

// Controla la visibilidad del botón/sección 'Sobre nosotros'
function updateAboutSectionVisibility() {
  if (!aboutSection) return;
  const admin =
    typeof isAdmin === "function"
      ? isAdmin()
      : localStorage.getItem("vf_admin") === "1";
  if (admin) {
    aboutSection.style.display = "none";
    if (aboutContent) aboutContent.style.display = "none";
  } else {
    aboutSection.style.display = "block";
    if (aboutContent) aboutContent.style.display = "none";
  }
}
window.addEventListener("DOMContentLoaded", function () {
  updateAboutSectionVisibility();
});
window.addEventListener("storage", function () {
  updateAboutSectionVisibility();
});

// Llama a updateAboutSectionVisibility tras login/logout admin
function afterAdminStateChange() {
  toggleProductForm();
  toggleAdminLoginBtn();
  renderLogoutBtn();
  updateAboutSectionVisibility();
  if (typeof renderTable === "function") renderTable();
}
