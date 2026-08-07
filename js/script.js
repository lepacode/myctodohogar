/* =========================================
   HEADER — BOTÓN ACTUALIZAR (RECARGA)
========================================= */
(function () {
    var refreshBtn = document.querySelector('.header__user');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            location.reload();
        });
    }
})();

/* =========================================
   HEADER — SCROLL DINÁMICO
========================================= */
(function () {
    var header = document.getElementById('header');
    var lastScroll = 0;

    function onScroll() {
        var y = window.scrollY;
        if (y > 60) {
            header.classList.add('header__scrolled');
        } else {
            header.classList.remove('header__scrolled');
        }
        lastScroll = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
})();

/* =========================================
   CARRUSEL — LOOP INFINITO
========================================= */
(function () {
    var track = document.getElementById('carouselTrack');
    if (!track) return;

    var dotsWrap = document.getElementById('carouselDots');
    var btnPrev = document.getElementById('carouselPrev');
    var btnNext = document.getElementById('carouselNext');

    /* Configuración */
    var clonesCount = 6;
    var cardWidth = 0;
    var gap = 16;
    var realTotal = 0;
    var total = 0;
    var realIndex = 0;
    var virtualIndex = 0;
    var interval = null;
    var animationTime = 550; // ms, igual que CSS transition
    var teleportTimeout = null;

    /* Variables para drag */
    var isDragging = false;
    var startX = 0;
    var currentTranslate = 0;
    var touchStartTranslate = 0;

    /* =========================================
       SETUP INFINITO — CLONAR CARDS
    ========================================= */
    function setupInfinite() {
        var cards = Array.from(track.querySelectorAll('.oportunidades__card'));
        realTotal = cards.length;
        if (realTotal === 0) return;

        // Ajustar clonesCount si hay pocas tarjetas
        if (realTotal < clonesCount) {
            clonesCount = realTotal;
        }

        // Clonar las últimas cards al principio
        for (var i = realTotal - clonesCount; i < realTotal; i++) {
            var clone = cards[i].cloneNode(true);
            clone.classList.add('clone');
            track.insertBefore(clone, cards[0]);
        }

        // Clonar las primeras cards al final
        for (var j = 0; j < clonesCount; j++) {
            var cloneEnd = cards[j].cloneNode(true);
            cloneEnd.classList.add('clone');
            track.appendChild(cloneEnd);
        }

        total = realTotal + (clonesCount * 2);
    }

    function getCardWidth() {
        var firstCard = track.querySelector('.oportunidades__card');
        if (firstCard) {
            return firstCard.getBoundingClientRect().width;
        }
        return 260;
    }

    function buildDots() {
        dotsWrap.innerHTML = '';
        for (var i = 0; i < realTotal; i++) {
            var dot = document.createElement('button');
            dot.className = 'oportunidades__dot' + (i === 0 ? ' oportunidades__dot--active' : '');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', 'Ir a la tarjeta ' + (i + 1));
            dot.dataset.index = i;
            dotsWrap.appendChild(dot);
        }
    }

    function updateDots() {
        var dots = dotsWrap.querySelectorAll('.oportunidades__dot');
        dots.forEach(function (d, i) {
            d.classList.toggle('oportunidades__dot--active', i === realIndex);
            d.setAttribute('aria-selected', i === realIndex ? 'true' : 'false');
        });
    }

    /* =========================================
       POSICIONAMIENTO
    ========================================= */
    function setPosition(animate) {
        cardWidth = getCardWidth();
        var offset = virtualIndex * (cardWidth + gap);
        currentTranslate = -offset;

        if (animate !== false) {
            track.style.transition = 'transform ' + animationTime + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
    }

    /* =========================================
       TELETRANSPORTE
    ========================================= */
    function teleportIfNeeded() {
        // Si estamos en los clones del inicio, saltar al final real
        if (virtualIndex < clonesCount) {
            virtualIndex = virtualIndex + realTotal;
            setPosition(false);
        }
        // Si estamos en los clones del final, saltar al inicio real
        else if (virtualIndex >= realTotal + clonesCount) {
            virtualIndex = virtualIndex - realTotal;
            setPosition(false);
        }
    }

    function scheduleTeleport() {
        // Limpiar timeout anterior si existe
        if (teleportTimeout) {
            clearTimeout(teleportTimeout);
        }
        // Programar teletransporte para justo después de la animación
        teleportTimeout = setTimeout(function () {
            teleportIfNeeded();
        }, animationTime + 10); // +10ms de margen
    }

    /* =========================================
       NAVEGACIÓN
    ========================================= */
    function goToVirtual(index, animate) {
        virtualIndex = index;
        realIndex = virtualIndex - clonesCount;
        realIndex = ((realIndex % realTotal) + realTotal) % realTotal;

        setPosition(animate);
        updateDots();

        if (animate !== false) {
            scheduleTeleport();
        }
    }

    function goToReal(index, animate) {
        realIndex = ((index % realTotal) + realTotal) % realTotal;
        virtualIndex = realIndex + clonesCount;
        setPosition(animate);
        updateDots();
    }

    function next() {
        teleportIfNeeded();
        goToVirtual(virtualIndex + 1);
    }

    function prev() {
        teleportIfNeeded();
        goToVirtual(virtualIndex - 1);
    }

    function startAutoplay() {
        stopAutoplay();
        interval = setInterval(next, 3500);
    }

    function stopAutoplay() {
        if (interval) { clearInterval(interval); interval = null; }
    }

    /* =========================================
       INICIALIZAR
    ========================================= */
    setupInfinite();
    buildDots();
    goToReal(0, false);
    startAutoplay();

    track.style.cursor = 'grab';

    /* =========================================
       BOTONES Y DOTS
    ========================================= */
    btnNext.addEventListener('click', function () { next(); startAutoplay(); });
    btnPrev.addEventListener('click', function () { prev(); startAutoplay(); });

    dotsWrap.addEventListener('click', function (e) {
        var dot = e.target.closest('.oportunidades__dot');
        if (dot) {
            goToReal(parseInt(dot.dataset.index, 10));
            startAutoplay();
        }
    });

    /* =========================================
       DRAG CON MOUSE (DESKTOP)
    ========================================= */
    function dragStart(e) {
        if (e.type === 'mousedown') {
            isDragging = true;
            startX = e.pageX;
            cardWidth = getCardWidth();
            stopAutoplay();
            track.style.cursor = 'grabbing';
            track.style.transition = 'none';
            // Cancelar teletransporte pendiente
            if (teleportTimeout) clearTimeout(teleportTimeout);
        }
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        var diff = e.pageX - startX;
        currentTranslate = -virtualIndex * (cardWidth + gap) + diff;
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        track.style.cursor = 'grab';

        var newIndex = Math.round(-currentTranslate / (cardWidth + gap));
        goToVirtual(newIndex);
        startAutoplay();
    }

    track.addEventListener('mousedown', dragStart);
    track.addEventListener('mousemove', drag);
    track.addEventListener('mouseup', dragEnd);
    track.addEventListener('mouseleave', function () {
        if (isDragging) dragEnd();
    });
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* =========================================
       TOUCH (MÓVIL)
    ========================================= */
    track.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        cardWidth = getCardWidth();
        touchStartTranslate = -virtualIndex * (cardWidth + gap);
        stopAutoplay();
        track.style.transition = 'none';
        if (teleportTimeout) clearTimeout(teleportTimeout);
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
        var diff = e.touches[0].clientX - startX;
        currentTranslate = touchStartTranslate + diff;
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
    }, { passive: true });

    track.addEventListener('touchend', function () {
        var newIndex = Math.round(-currentTranslate / (cardWidth + gap));
        goToVirtual(newIndex);
        startAutoplay();
    }, { passive: true });

    /* =========================================
       RESIZE
    ========================================= */
    window.addEventListener('resize', function () {
        setPosition(false);
    }, { passive: true });
})();

/* =========================================
   TABS DE CIUDADES
========================================= */
(function () {
    var tabs = document.querySelectorAll('.ciudades__tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) {
                t.classList.remove('ciudades__tab--active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('ciudades__tab--active');
            tab.setAttribute('aria-selected', 'true');
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    });
})();

/* =========================================
   HERO SEARCH — prevent default
========================================= */
(function () {
    var form = document.querySelector('.hero__search');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('.hero__search__btn');
            btn.textContent = 'Buscando...';
            setTimeout(function () { btn.textContent = 'Buscar Fechas'; }, 1800);
        });
    }
})();

/* =========================================
   BADGES ALEATORIOS — NUEVO / OFERTA
========================================= */
(function () {
    var items = document.querySelectorAll('.articulos__item');
    if (items.length === 0) return;

    var badges = [
        { src: 'assets/vectores/nuevo.svg', alt: 'Nuevo ingreso' },
        { src: 'assets/vectores/oferta.svg', alt: 'Oferta' }
    ];

    items.forEach(function (item) {
        var r = Math.random();
        var badge = null;

        // 40% nuevo, 20% oferta, 40% sin badge
        if (r < 0.40) {
            badge = badges[0];
        } else if (r < 0.60) {
            badge = badges[1];
        }

        if (badge) {
            var img = document.createElement('img');
            img.className = 'articulos__badge';
            img.src = badge.src;
            img.alt = badge.alt;
            item.appendChild(img);
        }
    });
})();

/* =========================================
   BUSCADOR EN TIEMPO REAL
========================================= */
(function () {
    var input = document.querySelector('.buscador__input');
    var items = document.querySelectorAll('.articulos__item');

    if (input && items.length > 0) {
        input.addEventListener('input', function (e) {
            var query = e.target.value.toLowerCase().trim();

            items.forEach(function (item) {
                var nameElement = item.querySelector('.articulos_name');
                if (nameElement) {
                    var nameText = nameElement.textContent.toLowerCase();
                    // Buscamos coincidencia
                    if (nameText.indexOf(query) !== -1) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    }
})();

/* =========================================
   FILTRADO Y NAVEGACIÓN POR CATEGORÍAS
   Nota: En el futuro esto será dinámico con 
   la base de datos, por ahora es estático.
========================================= */
(function () {
    const categoryButtons = document.querySelectorAll('.categoria__button');
    const articles = document.querySelectorAll('.articulos__item');
    const container = document.querySelector('#contenedor-articulos');

    if (categoryButtons.length > 0 && articles.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedCategory = button.getAttribute('data-categoria');

                // Filtrar artículos
                articles.forEach(article => {
                    const articleCategory = article.getAttribute('data-categoria');
                    let mostrar = false;

                    if (selectedCategory === 'todo') {
                        mostrar = true;
                    } else if (selectedCategory === 'ofertas' || selectedCategory === 'novedades') {
                        const badge = article.querySelector('.articulos__badge');
                        const src = badge ? (badge.getAttribute('src') || '') : '';
                        const esOferta = src.indexOf('oferta.svg') !== -1;
                        const esNuevo = src.indexOf('nuevo.svg') !== -1;
                        mostrar = selectedCategory === 'ofertas' ? esOferta : esNuevo;
                    } else {
                        mostrar = articleCategory === selectedCategory;
                    }

                    article.style.display = mostrar ? 'flex' : 'none';
                });

                // Scroll suave hacia los resultados
                if (container) {
                    const headerOffset = 100;
                    const elementPosition = container.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
})();

/* =========================================
   PRECIO CONTADO + FINANCIACIÓN
========================================= */
(function () {
    var precios = document.querySelectorAll('.articulos__precio');
    var semanas = [4, 6, 8, 12];

    precios.forEach(function (el) {
        var precioText = el.textContent.trim();
        var precioNum = parseFloat(precioText.replace(/[^0-9,]/g, '').replace(',', '.'));
        if (isNaN(precioNum) || precioNum <= 0) return;

        // Prefijo "Precio cont:"
        el.innerHTML = '<span class="articulos__precio-label">Precio cont:</span> ' + el.innerHTML;

        // Cuotas
        var div = document.createElement('div');
        div.className = 'articulos__cuotas';

        semanas.forEach(function (sem) {
            var total = precioNum * 1.3;
            var valor = total / sem;
            var valorStr = '$' + Math.round(valor).toLocaleString('es-AR').replace(/,/g, '.');
            var p = document.createElement('p');
            p.className = 'articulos__cuota';
            p.innerHTML = '• <b>' + sem + ' semanas</b> de <b>' + valorStr + '</b>';
            div.appendChild(p);
        });

        // Pago diario — 84 días (12 semanas × 7) con 50% de interés, destacado
        var valorDiario = (precioNum * 1.5) / 84;
        var valorDiarioStr = '$' + Math.round(valorDiario).toLocaleString('es-AR').replace(/,/g, '.');
        var pDiario = document.createElement('p');
        pDiario.className = 'articulos__cuota articulos__cuota--destacado';
        pDiario.innerHTML = '<b>84 días</b> de <b>' + valorDiarioStr + '</b>';
        div.appendChild(pDiario);

        el.parentNode.insertBefore(div, el.nextSibling);
    });
})();

/* =========================================
   CONSULTA WHATSAPP — BOTÓN "CONSULTAR"
========================================= */
(function () {
    const WHATSAPP_NUM = '543816421449';
    var btns = document.querySelectorAll('.articulos__btn');
    var semanas = [4, 6, 8, 12];

    if (btns.length === 0) return;

    function fmt(num) {
        return '$' + Math.round(num).toLocaleString('es-AR').replace(/,/g, '.');
    }

    btns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            var item = btn.closest('.articulos__item');
            if (!item) return;

            var nombreEl = item.querySelector('.articulos_name');
            var precioEl = item.querySelector('.articulos__precio');

            var nombre = nombreEl ? nombreEl.textContent.trim() : '';
            var precioNum = 0;
            if (precioEl) {
                precioNum = parseInt(precioEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
            }

            var total = precioNum * 1.3;
            var valorDiario = (precioNum * 1.5) / 84;

            var msg = 'Hola, quiero saber si tienen stock de _*' + nombre + '*_\n';
            msg += '\n-- _*Con las siguientes Financiaciones:*_\n';
            semanas.forEach(function (sem) {
                msg += '■ ' + sem + ' semanas de ' + fmt(total / sem) + '\n';
            });
            msg += '\n■ Y pagos diarios de: _*' + fmt(valorDiario) + '*_\n';
            msg += '\n_*¡Muchas gracias!*_';

            window.open('https://wa.me/' + WHATSAPP_NUM + '?text=' + encodeURIComponent(msg), '_blank');
        });
    });
})();

/* =========================================
   PEDIDO + LIGHTBOX
========================================= */
(function () {
    var overlay, content, precioUnitario;
    var pedido = [];

    // Clientes mock para prueba
    var clientes = {
        '12345678': { nombre: 'Juan Pérez', direccion: 'Av. Siempreviva 742', telefono: '011-1234-5678' },
        '87654321': { nombre: 'María García', direccion: 'Calle Falsa 123', telefono: '011-9876-5432' },
    };
    var clienteActual = null;
    var editandoCliente = false;

    function init() {
        overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        content = document.createElement('div');
        content.className = 'lightbox';
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    function fmt(num) {
        return '$' + Math.round(num).toLocaleString('es-AR').replace(/,/g, '.');
    }

    function calcMonto(precio, cant, plan) {
        if (plan === 'contado') return precio * cant;
        var sem = parseInt(plan, 10);
        if (isNaN(sem) || sem <= 0) return precio * cant;
        return precio * cant * 1.3 / sem;
    }

    /* ===== VISTA PRODUCTO ===== */
    function mostrarProducto(btn) {
        var item = btn.closest('.articulos__item');
        if (!item) return;

        var img = item.querySelector('.articulos__img');
        var nombre = item.querySelector('.articulos_name');
        var precioEl = item.querySelector('.articulos__precio');
        precioUnitario = 0;
        if (precioEl) {
            var txt = precioEl.textContent.trim();
            precioUnitario = parseFloat(txt.replace(/[^0-9,]/g, '').replace(',', '.'));
        }
        if (isNaN(precioUnitario) || precioUnitario <= 0) precioUnitario = 0;

        content.className = 'lightbox';

        var semanas = [4, 6, 8, 12];
        var radiosHtml = '<label class="lightbox__radio lightbox__radio--active">' +
            '<input type="radio" name="plan" value="contado" checked> ' +
            '<span class="lightbox__radio-label">Contado</span> ' +
            '<span class="lightbox__radio-monto">' + fmt(precioUnitario) + '</span></label>';
        semanas.forEach(function (sem) {
            var total = precioUnitario * 1.3;
            var valor = total / sem;
            radiosHtml += '<label class="lightbox__radio">' +
                '<input type="radio" name="plan" value="' + sem + '"> ' +
                '<span class="lightbox__radio-label">' + sem + ' semanas</span> ' +
                '<span class="lightbox__radio-monto">' + fmt(valor) + '</span></label>';
        });

        content.innerHTML =
            (img ? '<img class="lightbox__img" src="' + img.getAttribute('src') + '" alt="">' : '') +
            '<p class="lightbox__nombre">' + (nombre ? nombre.textContent.trim() : '') + '</p>' +
            '<label class="lightbox__label">Cantidad</label>' +
            '<div class="lightbox__cantidad">' +
                '<button class="lightbox__qty-btn lightbox__qty-btn--minus" data-accion="decrement">−</button>' +
                '<input class="lightbox__input" type="number" value="1" min="1">' +
                '<button class="lightbox__qty-btn lightbox__qty-btn--plus" data-accion="increment">+</button>' +
            '</div>' +
            '<div class="lightbox__planes">' + radiosHtml + '</div>' +
            '<div class="lightbox__acciones">' +
                '<button class="lightbox__btn lightbox__btn--cancelar" data-accion="cancelar">' + (pedido.length > 0 ? 'Volver' : 'Cancelar') + '</button>' +
                '<button class="lightbox__btn lightbox__btn--aceptar" data-accion="aceptar">Aceptar</button>' +
            '</div>';

        overlay.classList.add('active');

        content.querySelector('.lightbox__input').addEventListener('input', actualizarPlanes);
    }

    function actualizarPlanes() {
        var input = content.querySelector('.lightbox__input');
        var cant = input ? parseInt(input.value, 10) : 1;
        if (isNaN(cant) || cant < 1) cant = 1;

        var montos = content.querySelectorAll('.lightbox__radio-monto');
        if (!montos.length) return;

        var semanas = [4, 6, 8, 12];
        montos[0].textContent = fmt(precioUnitario * cant);
        semanas.forEach(function (sem, i) {
            var total = precioUnitario * cant * 1.3;
            var valor = total / sem;
            montos[i + 1].textContent = fmt(valor);
        });
    }

    /* ===== VISTA CONFIRMACIÓN ===== */
    function mostrarConfirmacion() {
        content.className = 'lightbox';
        content.innerHTML =
            '<div class="lightbox__icono">✓</div>' +
            '<p class="lightbox__mensaje">Artículo agregado al pedido</p>' +
            '<p class="lightbox__sub">Revisa <b>"Ver Pedido"</b></p>' +
            '<div class="lightbox__acciones">' +
                '<button class="lightbox__btn lightbox__btn--aceptar" data-accion="cerrar">Cerrar</button>' +
            '</div>';
    }

    function guardarCamposCliente() {
        if (!editandoCliente) return;
        var nom = document.getElementById('cli-nombre');
        var dni = document.getElementById('cli-dni');
        var dir = document.getElementById('cli-direccion');
        var tel = document.getElementById('cli-telefono');
        if (!nom) return;
        clienteActual = {
            nombre: nom.value.trim(),
            dni: dni.value.trim(),
            direccion: dir ? dir.value.trim() : '',
            telefono: tel ? tel.value.trim() : ''
        };
    }

    /* ===== VISTA VER PEDIDO ===== */
    function mostrarVerPedido() {
        guardarCamposCliente();
        content.className = 'lightbox lightbox--pedido';

        var html = '<div class="pedido__header"><span class="pedido__titulo">Pedido</span><button class="pedido__cerrar" data-accion="seguir-comprando">✕</button></div>';

        if (pedido.length === 0) {
            html += '<p class="pedido__vacio">No hay artículos en el pedido.</p>';
        } else {
            var totalGeneral = 0;
            pedido.forEach(function (item, i) {
                var planLabel = item.plan === 'contado' ? 'Contado' : item.plan + ' semanas';
                html += '<div class="pedido__item" data-index="' + i + '">' +
                    '<div class="pedido__item-info">' +
                        '<span class="pedido__item-nombre">' + item.nombre + '</span>' +
                        '<span class="pedido__item-detalle">' + item.cantidad + ' × ' + planLabel + '</span>' +
                    '</div>' +
                    '<span class="pedido__item-monto">' + fmt(item.montoTotal) + '</span>' +
                    '<button class="pedido__item-eliminar" data-accion="eliminar-item" data-index="' + i + '">✕</button>' +
                '</div>';
                totalGeneral += item.montoTotal;
            });
            html += '<div class="pedido__total">' +
                '<span>Total</span><span>' + fmt(totalGeneral) + '</span>' +
            '</div>';
        }

        html += '<div class="pedido__cliente" id="pedidoCliente">';

        if (editandoCliente) {
            html += '<div class="pedido__cliente-titulo">Nuevo Cliente</div>' +
                '<label class="pedido__campo">Nombre <input class="pedido__campo-input" id="cli-nombre" value="' + (clienteActual ? clienteActual.nombre : '') + '"></label>' +
                '<label class="pedido__campo">DNI <input class="pedido__campo-input" id="cli-dni" value="' + (clienteActual ? clienteActual.dni : '') + '"></label>' +
                '<label class="pedido__campo">Dirección <input class="pedido__campo-input" id="cli-direccion" value="' + (clienteActual ? clienteActual.direccion : '') + '"></label>' +
                '<label class="pedido__campo">Teléfono <input class="pedido__campo-input" id="cli-telefono" value="' + (clienteActual ? clienteActual.telefono : '') + '"></label>';
        } else if (clienteActual) {
            html += '<div class="pedido__cliente-titulo">Cliente</div>' +
                '<div class="pedido__cliente-dato"><span>Nombre</span><span>' + clienteActual.nombre + '</span></div>' +
                '<div class="pedido__cliente-dato"><span>DNI</span><span>' + clienteActual.dni + '</span></div>' +
                '<div class="pedido__cliente-dato"><span>Dirección</span><span>' + clienteActual.direccion + '</span></div>' +
                '<div class="pedido__cliente-dato"><span>Teléfono</span><span>' + (clienteActual.telefono || '—') + '</span></div>';
        } else {
            html += '<div class="pedido__cliente-titulo">Cliente</div>' +
                '<div class="pedido__busqueda">' +
                    '<input class="pedido__dni-input" id="dniBusqueda" placeholder="DNI del cliente" maxlength="8">' +
                    '<button class="pedido__btn-buscar" data-accion="buscar-dni">🔍</button>' +
                '</div>' +
                '<div class="pedido__cliente-divisor">o</div>' +
                '<button class="pedido__btn-nuevo" data-accion="nuevo-cliente">+ Nuevo Cliente</button>';
        }

        html += '</div>';

        html += '<div class="lightbox__acciones">' +
            '<button class="lightbox__btn lightbox__btn--cancelar" data-accion="seguir-comprando">Seguir comprando</button>' +
            '<button class="lightbox__btn lightbox__btn--aceptar" data-accion="confirmar-pedido">Confirmar</button>' +
        '</div>';

        content.innerHTML = html;
        overlay.classList.add('active');
    }

    function guardarItem() {
        var input = content.querySelector('.lightbox__input');
        var cant = input ? parseInt(input.value, 10) : 1;
        if (isNaN(cant) || cant < 1) cant = 1;

        var radio = content.querySelector('input[name="plan"]:checked');
        var plan = radio ? radio.value : 'contado';

        var nombre = content.querySelector('.lightbox__nombre');
        if (!nombre) return;
        var nom = nombre.textContent.trim();

        var monto = calcMonto(precioUnitario, cant, plan);

        // Acumular si mismo producto y mismo plan
        var existente = pedido.findIndex(function (p) {
            return p.nombre === nom && p.plan === plan;
        });
        if (existente >= 0) {
            pedido[existente].cantidad += cant;
            pedido[existente].montoTotal = calcMonto(precioUnitario, pedido[existente].cantidad, plan);
        } else {
            pedido.push({ nombre: nom, precioUnitario: precioUnitario, cantidad: cant, plan: plan, montoTotal: monto });
        }
    }

    /* ===== CLIENTE ===== */
    function buscarCliente(dni) {
        return clientes[dni] || null;
    }

    function cerrar() {
        overlay.classList.remove('active');
    }

    function setup() {
        init();

        // Los botones de las cards ahora abren WhatsApp (ver sección CONSULTA WHATSAPP).
        // El flujo de pedido queda dormido para uso futuro.

        // Botón "Ver Pedido" (oculto por CSS, se reutiliza más adelante)
        document.getElementById('pedidoBtn').addEventListener('click', function () {
            mostrarVerPedido();
        });

        // Delegación overlay
        overlay.addEventListener('click', function (e) {
            var target = e.target.closest('[data-accion]');
            if (!target) return;
            var accion = target.getAttribute('data-accion');

            // General
            if (accion === 'cerrar') {
                cerrar();
            } else if (accion === 'seguir-comprando') {
                guardarCamposCliente();
                cerrar();
            } else if (accion === 'cancelar-pedido') {
                guardarCamposCliente();
                cerrar();
            } else if (accion === 'cancelar') {
                if (pedido.length > 0) {
                    mostrarVerPedido();
                } else {
                    cerrar();
                }
            }

            // Producto
            else if (accion === 'aceptar') {
                guardarItem();
                mostrarConfirmacion();
            } else if (accion === 'increment') {
                var input = content.querySelector('.lightbox__input');
                if (input) { input.value = parseInt(input.value, 10) + 1; actualizarPlanes(); }
            } else if (accion === 'decrement') {
                var input = content.querySelector('.lightbox__input');
                if (input) {
                    var val = parseInt(input.value, 10);
                    if (val > 1) { input.value = val - 1; actualizarPlanes(); }
                }
            }

            // Ver Pedido
            else if (accion === 'eliminar-item') {
                var idx = parseInt(target.getAttribute('data-index'), 10);
                if (!isNaN(idx) && idx >= 0 && idx < pedido.length) {
                    pedido.splice(idx, 1);
                }
                mostrarVerPedido();
            } else if (accion === 'buscar-dni') {
                var dniInput = document.getElementById('dniBusqueda');
                if (!dniInput) return;
                var dni = dniInput.value.trim();
                if (dni.length < 7) return;
                var encontrado = buscarCliente(dni);
                if (encontrado) {
                    clienteActual = { dni: dni, nombre: encontrado.nombre, direccion: encontrado.direccion, telefono: encontrado.telefono };
                    editandoCliente = false;
                } else {
                    clienteActual = null;
                    editandoCliente = false;
                    mostrarVerPedido();
                    // Mostrar aviso de no encontrado
                    var aviso = document.createElement('p');
                    aviso.style.cssText = 'color:#e84c4c;font-size:.75rem;margin-top:.3em;text-align:center';
                    aviso.textContent = 'Cliente no encontrado. Usá "Nuevo Cliente".';
                    var sec = document.getElementById('pedidoCliente');
                    if (sec) sec.appendChild(aviso);
                    return;
                }
                mostrarVerPedido();
            } else if (accion === 'nuevo-cliente') {
                clienteActual = { nombre: '', dni: '', direccion: '', telefono: '' };
                editandoCliente = true;
                mostrarVerPedido();
            } else if (accion === 'confirmar-pedido') {
                // Guardar datos del cliente si está en modo edición
                if (editandoCliente) {
                    var nom = document.getElementById('cli-nombre');
                    var dni = document.getElementById('cli-dni');
                    var dir = document.getElementById('cli-direccion');
                    var tel = document.getElementById('cli-telefono');
                    if (nom && dni) {
                        clienteActual = {
                            nombre: nom.value.trim(),
                            dni: dni.value.trim(),
                            direccion: dir ? dir.value.trim() : '',
                            telefono: tel ? tel.value.trim() : ''
                        };
                    }
                }
                if (pedido.length === 0) return;
                if (!clienteActual || !clienteActual.nombre) return;
                content.className = 'lightbox';
                content.innerHTML =
                    '<div class="lightbox__icono">✓</div>' +
                    '<p class="lightbox__mensaje">Pedido confirmado</p>' +
                    '<p class="lightbox__sub">Los datos se guardaron correctamente.</p>' +
                    '<div class="lightbox__acciones">' +
                        '<button class="lightbox__btn lightbox__btn--aceptar" data-accion="cerrar-exito">Cerrar</button>' +
                    '</div>';
            } else if (accion === 'cerrar-exito') {
                pedido = [];
                clienteActual = null;
                editandoCliente = false;
                cerrar();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();