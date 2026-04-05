// Main site interactions: gallery, modals, navigation, i18n, and contact form.
document.addEventListener("DOMContentLoaded", () => {
    const setupWebVitalsObservers = () => {
        if (!("PerformanceObserver" in window)) {
            return;
        }

        const vitals = {
            cls: 0,
            lcp: 0,
            inp: 0
        };

        try {
            const clsObserver = new PerformanceObserver((entryList) => {
                entryList.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        vitals.cls += entry.value;
                    }
                });
            });
            clsObserver.observe({ type: "layout-shift", buffered: true });
        } catch (error) {
            // Ignore unsupported entry type.
        }

        try {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    vitals.lcp = lastEntry.startTime;
                }
            });
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
        } catch (error) {
            // Ignore unsupported entry type.
        }

        try {
            const inpObserver = new PerformanceObserver((entryList) => {
                entryList.getEntries().forEach((entry) => {
                    const interactionLatency = entry.duration || 0;
                    vitals.inp = Math.max(vitals.inp, interactionLatency);
                });
            });
            inpObserver.observe({ type: "event", buffered: true, durationThreshold: 40 });
        } catch (error) {
            // Ignore unsupported entry type.
        }

        const logVitals = () => {
            console.info("[WebVitals]", {
                LCP: Math.round(vitals.lcp),
                CLS: Number(vitals.cls.toFixed(4)),
                INP: Math.round(vitals.inp)
            });
        };

        window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                logVitals();
            }
        });
    };

    setupWebVitalsObservers();

    const gallerySlides = document.querySelectorAll(".gallery-slide");
    const galleryCarousels = document.querySelectorAll("[data-carousel]");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const caption = document.getElementById("caption");
    const closeBtn = document.querySelector(".close");
    const lightboxPrevBtn = document.getElementById("lightbox-prev");
    const lightboxNextBtn = document.getElementById("lightbox-next");
    const isMobileView = () => window.matchMedia("(max-width: 768px)").matches;
    let lightboxSlides = [];
    let lightboxIndex = 0;
    let lightboxCarousel = null;

    const upgradeSlideToFull = (slide) => {
        const fullSrc = slide.dataset.fullsrc;
        if (!fullSrc || slide.getAttribute("src") === fullSrc) {
            return;
        }

        const preloader = new Image();
        preloader.decoding = "async";
        preloader.src = fullSrc;
        preloader.onload = () => {
            slide.setAttribute("src", fullSrc);
        };
    };

    // Performance pass: eager-load only critical visuals and defer offscreen images.
    const optimizeImageLoading = () => {
        const serviceImages = document.querySelectorAll("#services .service-card img");
        serviceImages.forEach((img) => {
            img.loading = "lazy";
            img.decoding = "async";
            if (!img.hasAttribute("width")) {
                img.setAttribute("width", "1200");
            }
            if (!img.hasAttribute("height")) {
                img.setAttribute("height", "800");
            }
        });

        gallerySlides.forEach((slide) => {
            slide.decoding = "async";
            const isActive = slide.classList.contains("active");
            slide.loading = isActive ? "eager" : "lazy";
            slide.fetchPriority = isActive ? "auto" : "low";

            const currentSrc = slide.getAttribute("src");
            if (!slide.dataset.fullsrc && currentSrc) {
                slide.dataset.fullsrc = currentSrc;
                slide.dataset.thumbsrc = currentSrc.replace("multi-media/", "multi-media/thumbs/");
            }

            if (!slide.hasAttribute("width")) {
                slide.setAttribute("width", "1200");
            }
            if (!slide.hasAttribute("height")) {
                slide.setAttribute("height", "800");
            }

            // Keep only the visible frame sourced initially; hydrate others on demand.
            if (isActive && slide.dataset.thumbsrc) {
                slide.setAttribute("src", slide.dataset.thumbsrc);
                const defer = window.requestIdleCallback || ((cb) => setTimeout(cb, 900));
                defer(() => upgradeSlideToFull(slide));
            }

            if (!isActive && slide.getAttribute("src")) {
                slide.removeAttribute("src");
            }
        });

        if (lightboxImg) {
            lightboxImg.decoding = "async";
        }
    };

    optimizeImageLoading();

    const updateLightboxImage = () => {
        if (!lightboxSlides.length) {
            return;
        }

        const slide = lightboxSlides[lightboxIndex];
        lightboxImg.src = slide.dataset.fullsrc || slide.src;
        caption.innerText = "";
    };

    const moveLightbox = (step) => {
        if (lightbox.style.display !== "flex" || lightboxSlides.length <= 1) {
            return;
        }

        lightboxIndex = (lightboxIndex + step + lightboxSlides.length) % lightboxSlides.length;
        updateLightboxImage();

        if (lightboxCarousel && typeof lightboxCarousel._showSlide === "function") {
            lightboxCarousel._showSlide(lightboxIndex);
        }
    };

    // Open lightbox with the clicked image and keep carousel state in sync.
    gallerySlides.forEach((slide) => {
        slide.addEventListener("click", (e) => {
            if (isMobileView()) {
                return;
            }

            const clickedSlide = e.currentTarget;
            const carousel = clickedSlide.closest("[data-carousel]");
            const slides = carousel ? Array.from(carousel.querySelectorAll(".gallery-slide")) : [];

            lightboxCarousel = carousel;
            lightboxSlides = slides;
            lightboxIndex = Math.max(slides.indexOf(clickedSlide), 0);

            lightbox.style.display = "flex";
            updateLightboxImage();
        });
    });

    // Per-card carousel behavior (buttons + touch swipe).
    galleryCarousels.forEach((carousel) => {
        const slides = carousel.querySelectorAll(".gallery-slide");
        const prevBtn = carousel.querySelector('.carousel-btn[data-direction="prev"]');
        const nextBtn = carousel.querySelector('.carousel-btn[data-direction="next"]');
        let currentIndex = 0;
        let touchStartX = 0;
        let touchEndX = 0;

        const showSlide = (index) => {
            slides.forEach((slide, idx) => {
                slide.classList.toggle("active", idx === index);
                slide.loading = idx === index ? "eager" : "lazy";
                slide.fetchPriority = idx === index ? "auto" : "low";

                if (idx === index) {
                    if (!slide.getAttribute("src") && slide.dataset.fullsrc) {
                        slide.setAttribute("src", slide.dataset.fullsrc);
                    } else {
                        upgradeSlideToFull(slide);
                    }
                } else if (slide.getAttribute("src")) {
                    slide.removeAttribute("src");
                }
            });
            currentIndex = index;
        };

        carousel._showSlide = showSlide;

        prevBtn.addEventListener("click", () => {
            const nextIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(nextIndex);
        });

        nextBtn.addEventListener("click", () => {
            const nextIndex = (currentIndex + 1) % slides.length;
            showSlide(nextIndex);
        });

        carousel.addEventListener("touchstart", (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });

        carousel.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX;

            if (Math.abs(deltaX) < 35) {
                return;
            }

            if (deltaX < 0) {
                const nextIndex = (currentIndex + 1) % slides.length;
                showSlide(nextIndex);
                return;
            }

            const nextIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(nextIndex);
        }, { passive: true });
    });

    // Close lightbox from close button.
    closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none";
    });

    lightboxPrevBtn.addEventListener("click", () => {
        moveLightbox(-1);
    });

    lightboxNextBtn.addEventListener("click", () => {
        moveLightbox(1);
    });

    // Close lightbox when clicking outside the image.
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none"; 
        }
    });

    // Keyboard support for lightbox navigation.
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'Escape') {
                lightbox.style.display = 'none';
                return;
            }

            if (e.key === 'ArrowLeft') {
                moveLightbox(-1);
                return;
            }

            if (e.key === 'ArrowRight') {
                moveLightbox(1);
            }
        }
    });

    // Service detail modal content is generated from the active language map.
    const svcModal = document.getElementById('service-modal');
    if (svcModal) {
        const svcModalImg   = document.getElementById('svc-modal-img');
        const svcModalTitle = document.getElementById('svc-modal-title');
        const svcModalDesc  = document.getElementById('svc-modal-desc');
        const svcModalList  = document.getElementById('svc-modal-list');
        const svcModalCta   = document.getElementById('svc-modal-cta');
        const svcModalClose = svcModal.querySelector('.svc-modal-close');

        const SERVICE_IMAGES = {
            kitchen:  'multi-media/responsive/KITCHEN4-960.jpeg',
            bathroom: 'multi-media/responsive/BATH5-960.jpeg',
            roofing:  'multi-media/responsive/ROOF3-960.jpeg',
            siding:   'multi-media/responsive/SIDE4-960.jpeg',
            interior: 'multi-media/responsive/MSTAIR2-960.jpeg',
            garden:   'multi-media/responsive/DECK9-960.jpeg',
        };

        const openServiceModal = (serviceKey) => {
            const lang = localStorage.getItem('preferredLanguage') || (navigator.language.startsWith('es') ? 'es' : 'en');
            const t = translations[lang];
            svcModalImg.src           = SERVICE_IMAGES[serviceKey] || '';
            svcModalImg.alt           = t['services.' + serviceKey + '.title'] || '';
            svcModalTitle.textContent = t['services.' + serviceKey + '.title'] || '';
            svcModalDesc.textContent  = t['services.' + serviceKey + '.desc']  || '';
            svcModalCta.textContent   = t['services.modal.cta'] || 'Get a Free Quote';
            const items = (t['services.' + serviceKey + '.modal.items'] || '').split('|').filter(Boolean);
            svcModalList.innerHTML = items.map(function(item) { return '<li>' + item + '</li>'; }).join('');
            svcModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        const closeServiceModal = () => {
            svcModal.classList.remove('open');
            document.body.style.overflow = '';
        };

        document.querySelectorAll('.svc-learn-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { openServiceModal(btn.dataset.service); });
        });

        svcModalCta.addEventListener('click', closeServiceModal);
        svcModalClose.addEventListener('click', closeServiceModal);
        svcModal.addEventListener('click', function(e) { if (e.target === svcModal) closeServiceModal(); });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && svcModal.classList.contains('open')) closeServiceModal(); });
    }

    // Mobile menu and smooth anchor scrolling.
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('main-nav');

    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (!targetSection) {
                return;
            }

            // Close mobile menu before scrolling so layout is stable.
            mainNav.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (targetId === 'home') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }

                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });
        });
    });

    hamburger.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Localization strings (English + Spanish).
    const translations = {
        en: {
            'nav.home': 'HOME',
            'nav.about': 'ABOUT',
            'nav.services': 'SERVICES',
            'nav.gallery': 'GALLERY',
            'nav.contact': 'CONTACT',
            'home.title': 'Transforming Spaces, <br> Creating Dreams',
            'home.cta': 'Get a Free Quote',
            'about.title': 'About Almonte Modern Living',
            'about.p1': 'At Almonte Modern Living, we believe that your home should be a reflection of your unique style and personality. With over 10 years of experience in the remodeling industry, our dedicated team is committed to transforming your dreams into reality.',
            'about.p2': 'We specialize in a wide range of remodeling services, including kitchen and bathroom renovations, home additions, and interior design. Our goal is to create functional, beautiful spaces that enhance your lifestyle while adding value to your home.',
            'about.p3': 'We pride ourselves on our attention to detail, quality craftsmanship, and exceptional customer service. Every project we undertake is treated with the utmost care and professionalism. From the initial consultation to the final touches, we work closely with our clients to ensure their vision is realized.',
            'about.p4': 'Join us on this journey to create the space of your dreams. Let Almonte Modern Living bring your vision to life!',
            'services.title': 'Our Services',
            'services.subtitle': 'From interiors to full exterior upgrades, we deliver reliable craftsmanship and clean finishes that increase your home\'s value.',
            'services.kitchen.title': 'Kitchen Remodeling',
            'services.kitchen.desc': 'Upgrade your kitchen with custom layouts, quality cabinetry, countertops, and finishes built for everyday living.',
            'services.bathroom.title': 'Bathroom Remodeling',
            'services.bathroom.desc': 'Create a modern, comfortable bathroom with tile work, premium fixtures, and efficient layouts made to last.',
            'services.interior.title': 'Inside Stairs Remodeling & Construction',
            'services.interior.desc': 'Transform your interior stairs with custom remodeling and construction built for safety, durability, and elegant style.',
            'services.siding.title': 'Siding Installation & Repair',
            'services.siding.desc': 'Improve curb appeal and protection with durable siding installation, replacement, and detailed repair work.',
            'services.roofing.title': 'Roofing Installation & Repair',
            'services.roofing.desc': 'From full replacements to repairs, we provide weather-resistant roofing systems with dependable workmanship.',
            'services.garden.title': 'Patio & Decking',
            'services.garden.desc': 'Transform your outdoor area with patio and decking upgrades designed for comfort, durability, and clean design.',
            'gallery.title': 'Gallery',
            'contact.title': 'Contact Us',
            'contact.subtitle': 'Get in touch for a free consultation!',
            'contact.form.name': 'Name:',
            'contact.form.email': 'Email:',
            'contact.form.phone': 'Phone:',
            'contact.form.projectType': 'Project Type:',
            'contact.form.projectType.placeholder': 'Select a service',
            'contact.form.projectType.kitchen': 'Kitchen Remodeling',
            'contact.form.projectType.bathroom': 'Bathroom Remodeling',
            'contact.form.projectType.roofing': 'Roofing',
            'contact.form.projectType.siding': 'Siding',
            'contact.form.projectType.interior': 'Inside Stairs',
            'contact.form.projectType.garden': 'Patio & Decking',
            'contact.form.projectType.other': 'Other',
            'contact.form.zip': 'ZIP Code:',
            'contact.form.contactPreference': 'Preferred Contact Method:',
            'contact.form.contactPreference.any': 'Any',
            'contact.form.contactPreference.phone': 'Phone',
            'contact.form.contactPreference.email': 'Email',
            'contact.form.contactPreference.text': 'Text Message',
            'contact.form.contactPreference.whatsapp': 'WhatsApp',
            'contact.form.message': 'Message:',
            'contact.form.submit': 'Send Message',
            'contact.info.title': 'Contact Information',
            'contact.info.phoneLabel': 'Phone:',
            'contact.info.phone': '(347) 634-5288',
            'contact.info.emailLabel': 'Email:',
            'contact.info.email': 'info@almontemodernliving.com',
            'contact.info.addressLabel': 'Address:',
            'contact.info.address': 'New York',
            'contact.info.areaLabel': 'Service Area:',
            'contact.info.area': 'Serving all 5 NYC Boroughs',
            'contact.info.responseLabel': 'Response Time:',
            'contact.info.response': 'We respond within 24 hours',
            'contact.summary.title': 'Project Request Summary',
            'contact.summary.subtitle': 'As you fill the form, your request details appear here.',
            'contact.summary.project': 'Project:',
            'contact.summary.zip': 'ZIP:',
            'contact.summary.preference': 'Preference:',
            'contact.summary.pending': 'Pending',
            'contact.info.whatsappBtn': 'Message on WhatsApp',
            'contact.info.smsBtn': 'Send Text Message',
            'trust.years': '10+ Years Experience',
            'trust.projects': '300+ Projects Completed',
            'trust.area': 'All 5 NYC Boroughs',
            'trust.licensed': 'Licensed & Insured',
            'trust.free': 'Free Estimates',
            'services.learnMore': 'Learn More',
            'services.modal.cta': 'Get a Free Quote',
            'services.kitchen.modal.items': 'Custom cabinet design & installation|Countertop fabrication: granite, quartz & marble|Backsplash & tile installation|Plumbing & fixture upgrades|Kitchen lighting installation|Full project management',
            'services.bathroom.modal.items': 'Floor & wall tile installation|Vanity & fixture replacement|Shower & tub conversion|Waterproofing & moisture control|Lighting & ventilation upgrades|Accessibility options available',
            'services.roofing.modal.items': 'Full roof replacement & installation|Emergency leak detection & repair|Shingle, flat & metal roofing systems|Gutter installation & repair|Damage inspection & assessment|Weather-resistant materials & warranties',
            'services.siding.modal.items': 'Vinyl, fiber cement & wood siding|Full panel replacement & installation|Trim, corner & accent piece work|Caulking, sealing & weatherproofing|Painting & premium finishing|Storm & impact damage repair',
            'services.interior.modal.items': 'Custom stair layout & design|Tread & riser replacement|Baluster & railing installation|Hardwood, tile & carpet options|Structural reinforcement & repair|Code-compliant & permit-ready builds',
            'services.garden.modal.items': 'Wood, composite & PVC decking|Custom patio design & layout|Pergola & shade structure installation|Steps, railing & border work|Weatherproofing & deck sealing|Outdoor lighting prep & wiring',
            'footer.rights': 'All Rights Reserved.',
            'footer.text': '© 2026 Almonte Modern Living. All Rights Reserved.',
            'contact.alert': 'Thank you for your message! We will get back to you soon.',
            'contact.error': 'There was an error sending your message. Please try again.'
        },
        es: {
            'nav.home': 'INICIO',
            'nav.about': 'SOBRE NOSOTROS',
            'nav.services': 'SERVICIOS',
            'nav.gallery': 'GALERÍA',
            'nav.contact': 'CONTACTO',
            'home.title': 'Transformando Espacios, <br> Creando Sueños',
            'home.cta': 'Solicita una Cotización',
            'about.title': 'Acerca de Almonte Modern Living',
            'about.p1': 'En Almonte Modern Living, creemos que tu hogar debe ser un reflejo de tu estilo único y personalidad. Con más de 10 años de experiencia en la industria de remodelación, nuestro equipo dedicado está comprometido a transformar tus sueños en realidad.',
            'about.p2': 'Nos especializamos en una amplia gama de servicios de remodelación, incluyendo renovaciones de cocina y baño, ampliaciones del hogar y diseño de interiores. Nuestro objetivo es crear espacios funcionales y hermosos que mejoren tu estilo de vida mientras aumentan el valor de tu hogar.',
            'about.p3': 'Nos enorgullece nuestra atención al detalle, mano de obra de calidad y servicio al cliente excepcional. Cada proyecto que emprendemos se trata con el máximo cuidado y profesionalismo. Desde la consulta inicial hasta los toques finales, trabajamos en estrecha colaboración con nuestros clientes para asegurar que su visión se haga realidad.',
            'about.p4': '¡Acompáñanos en este viaje para crear el espacio de tus sueños. Deja que Almonte Modern Living haga realidad tu visión!',
            'services.title': 'Nuestros Servicios',
            'services.subtitle': 'Desde interiores hasta mejoras exteriores completas, ofrecemos mano de obra confiable y acabados limpios que aumentan el valor de tu hogar.',
            'services.kitchen.title': 'Remodelación de Cocina',
            'services.kitchen.desc': 'Renueva tu cocina con distribución personalizada, gabinetes de calidad, encimeras y acabados diseñados para el uso diario.',
            'services.bathroom.title': 'Remodelación de Baño',
            'services.bathroom.desc': 'Crea un baño moderno y cómodo con instalación de azulejos, accesorios premium y distribuciones eficientes y duraderas.',
            'services.interior.title': 'Remodelación y Construcción de Escaleras Interiores',
            'services.interior.desc': 'Transforma tus escaleras interiores con remodelación y construcción personalizada, diseñada para seguridad, durabilidad y estilo elegante.',
            'services.siding.title': 'Instalación y Reparación de Siding',
            'services.siding.desc': 'Mejora la fachada y protección de tu hogar con instalación, reemplazo y reparación detallada de siding duradero.',
            'services.roofing.title': 'Instalación y Reparación de Techos',
            'services.roofing.desc': 'Desde reemplazos completos hasta reparaciones, instalamos sistemas de techo resistentes al clima con mano de obra confiable.',
            'services.garden.title': 'Remodelación de Patio y Deck',
            'services.garden.desc': 'Transforma tu espacio exterior con mejoras de patio y deck diseñadas para comodidad, durabilidad y un estilo limpio.',
            'gallery.title': 'Galería',
            'contact.title': 'Contáctanos',
            'contact.subtitle': '¡Ponte en contacto para una consulta gratuita!',
            'contact.form.name': 'Nombre:',
            'contact.form.email': 'Correo Electrónico:',
            'contact.form.phone': 'Teléfono:',
            'contact.form.projectType': 'Tipo de Proyecto:',
            'contact.form.projectType.placeholder': 'Selecciona un servicio',
            'contact.form.projectType.kitchen': 'Remodelación de Cocina',
            'contact.form.projectType.bathroom': 'Remodelación de Baño',
            'contact.form.projectType.roofing': 'Techos',
            'contact.form.projectType.siding': 'Siding',
            'contact.form.projectType.interior': 'Escaleras Interiores',
            'contact.form.projectType.garden': 'Patio y Deck',
            'contact.form.projectType.other': 'Otro',
            'contact.form.zip': 'Código Postal:',
            'contact.form.contactPreference': 'Método de Contacto Preferido:',
            'contact.form.contactPreference.any': 'Cualquiera',
            'contact.form.contactPreference.phone': 'Teléfono',
            'contact.form.contactPreference.email': 'Correo',
            'contact.form.contactPreference.text': 'Mensaje de Texto',
            'contact.form.contactPreference.whatsapp': 'WhatsApp',
            'contact.form.message': 'Mensaje:',
            'contact.form.submit': 'Enviar Mensaje',
            'contact.info.title': 'Información de Contacto',
            'contact.info.phoneLabel': 'Teléfono:',
            'contact.info.phone': '(347) 634-5288',
            'contact.info.emailLabel': 'Correo:',
            'contact.info.email': 'info@almontemodernliving.com',
            'contact.info.addressLabel': 'Dirección:',
            'contact.info.address': 'New York',
            'contact.info.areaLabel': 'Área de Servicio:',
            'contact.info.area': 'Cubrimos los 5 condados de NYC',
            'contact.info.responseLabel': 'Tiempo de Respuesta:',
            'contact.info.response': 'Respondemos en menos de 24 horas',
            'contact.summary.title': 'Resumen de Solicitud',
            'contact.summary.subtitle': 'Mientras completas el formulario, los detalles aparecen aqui.',
            'contact.summary.project': 'Proyecto:',
            'contact.summary.zip': 'ZIP:',
            'contact.summary.preference': 'Preferencia:',
            'contact.summary.pending': 'Pendiente',
            'contact.info.whatsappBtn': 'Escribir por WhatsApp',
            'contact.info.smsBtn': 'Enviar Mensaje de Texto',
            'trust.years': 'Más de 10 Años de Experiencia',
            'trust.projects': 'Más de 300 Proyectos',
            'trust.area': 'Los 5 Condados de NYC',
            'trust.licensed': 'Licenciados y Asegurados',
            'trust.free': 'Estimados Gratuitos',
            'services.learnMore': 'Ver más',
            'services.modal.cta': 'Solicitar Cotización',
            'services.kitchen.modal.items': 'Diseño e instalación de gabinetes personalizados|Encimeras de granito, cuarzo y mármol|Instalación de azulejos y backsplash|Mejoras de plomería y accesorios|Instalación de iluminación|Gestión completa del proyecto',
            'services.bathroom.modal.items': 'Instalación de azulejos en piso y paredes|Reemplazo de vanidad y accesorios|Conversión de ducha y bañera|Impermeabilización y control de humedad|Mejoras de iluminación y ventilación|Opciones de accesibilidad disponibles',
            'services.roofing.modal.items': 'Reemplazo e instalación completa de techo|Detección y reparación de goteras|Techos de tejas, planos y metálicos|Instalación y reparación de canaletas|Inspección y evaluación de daños|Materiales resistentes al clima con garantía',
            'services.siding.modal.items': 'Siding de vinilo, fibrocemento y madera|Reemplazo e instalación completa de paneles|Molduras, esquinas y piezas de acento|Sellado, calafateo e impermeabilización|Pintura y acabados premium|Reparación de daños por tormentas',
            'services.interior.modal.items': 'Diseño y distribución personalizada de escaleras|Reemplazo de huellas y contrahuellas|Instalación de balaustres y pasamanos|Opciones en madera, azulejo y alfombra|Refuerzo y reparación estructural|Construcción conforme a código y permisos',
            'services.garden.modal.items': 'Decking de madera, composite y PVC|Diseño y distribución personalizada de patio|Instalación de pérgolas y estructuras de sombra|Escalones, barandas y bordes|Impermeabilización y sellado del deck|Preparación para iluminación exterior',
            'footer.rights': 'Todos los derechos reservados.',
            'footer.text': '© 2026 Almonte Modern Living. Todos los derechos reservados.',
            'contact.alert': '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.',
            'contact.error': 'Hubo un error al enviar tu mensaje. Intenta nuevamente.'
        }
    };

    const applyLanguage = (lang) => {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = translations[lang]?.[key];
            if (value) {
                if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
                    el.placeholder = value;
                } else {
                    el.innerHTML = value;
                }
            }
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        localStorage.setItem('preferredLanguage', lang);
    };

    const defaultLang = localStorage.getItem('preferredLanguage') || (navigator.language.startsWith('es') ? 'es' : 'en');
    applyLanguage(defaultLang);

    // Keep phone and ZIP input values numeric.
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/\D/g, '');
        });
    }

    const zipInput = document.getElementById('zip');
    if (zipInput) {
        zipInput.addEventListener('input', () => {
            zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
        });
    }

    const summaryProject = document.getElementById('summary-project');
    const summaryZip = document.getElementById('summary-zip');
    const summaryPreference = document.getElementById('summary-preference');
    const projectTypeInput = document.getElementById('project-type');
    const preferenceInput = document.getElementById('contact-preference');

    const updateContactSummary = () => {
        if (!summaryProject || !summaryZip || !summaryPreference) {
            return;
        }

        const lang = localStorage.getItem('preferredLanguage') || (navigator.language.startsWith('es') ? 'es' : 'en');
        const pendingText = translations[lang]['contact.summary.pending'] || 'Pending';

        const projectValue = projectTypeInput && projectTypeInput.value ? projectTypeInput.options[projectTypeInput.selectedIndex].text : '';
        const zipValue = zipInput && zipInput.value ? zipInput.value : '';
        const preferenceValue = preferenceInput && preferenceInput.value ? preferenceInput.options[preferenceInput.selectedIndex].text : '';

        summaryProject.textContent = projectValue || pendingText;
        summaryZip.textContent = zipValue || pendingText;
        summaryPreference.textContent = preferenceValue || pendingText;
    };

    if (projectTypeInput) {
        projectTypeInput.addEventListener('change', updateContactSummary);
    }

    if (zipInput) {
        zipInput.addEventListener('input', updateContactSummary);
    }

    if (preferenceInput) {
        preferenceInput.addEventListener('change', updateContactSummary);
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyLanguage(btn.getAttribute('data-lang'));
            updateContactSummary();
        });
    });

    updateContactSummary();

    // Submit contact form through Formspree and show localized status feedback.
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const lang = localStorage.getItem('preferredLanguage') || (navigator.language.startsWith('es') ? 'es' : 'en');
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            if (formStatus) {
                formStatus.textContent = '';
                formStatus.className = 'form-status';
            }

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: {
                        Accept: 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Formspree request failed');
                }

                contactForm.reset();
                if (formStatus) {
                    formStatus.textContent = translations[lang]['contact.alert'];
                    formStatus.classList.add('success');
                }
            } catch (error) {
                if (formStatus) {
                    formStatus.textContent = translations[lang]['contact.error'];
                    formStatus.classList.add('error');
                }
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Update footer year automatically.
    document.getElementById('footer-year').textContent = new Date().getFullYear();

    // Toggle and handle back-to-top control.
    const backToTopBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

