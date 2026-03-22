// GALLERY
document.addEventListener("DOMContentLoaded", () => {
    const gallerySlides = document.querySelectorAll(".gallery-slide");
    const galleryCarousels = document.querySelectorAll("[data-carousel]");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const caption = document.getElementById("caption");
    const closeBtn = document.querySelector(".close");

    // Open lightbox on image click
    gallerySlides.forEach((slide) => {
        slide.addEventListener("click", (e) => {
            lightbox.style.display = "flex"; 
            lightboxImg.src = e.target.src; 
            caption.innerText = "";
        });
    });

    // Per-card carousel controls
    galleryCarousels.forEach((carousel) => {
        const slides = carousel.querySelectorAll(".gallery-slide");
        const prevBtn = carousel.querySelector('.carousel-btn[data-direction="prev"]');
        const nextBtn = carousel.querySelector('.carousel-btn[data-direction="next"]');
        let currentIndex = 0;

        const showSlide = (index) => {
            slides.forEach((slide, idx) => {
                slide.classList.toggle("active", idx === index);
            });
            currentIndex = index;
        };

        prevBtn.addEventListener("click", () => {
            const nextIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(nextIndex);
        });

        nextBtn.addEventListener("click", () => {
            const nextIndex = (currentIndex + 1) % slides.length;
            showSlide(nextIndex);
        });
    });

    // Close lightbox when clicking on the close button
    closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none"; 
    });

    // Close lightbox when clicking anywhere outside the image
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none"; 
        }
    });

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'Escape') {
                lightbox.style.display = 'none';
            }
        }
    });

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('main-nav');

    // Smooth scrolling for navigation with sticky-header offset
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (!targetSection) {
                return;
            }

            // Close mobile menu before measuring final header height
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

    // Localization (English + Spanish)
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
            'services.subtitle': 'At Almonte Modern Living, we offer a variety of remodeling services to transform your home. Here are some of our key offerings:',
            'services.kitchen.title': 'Kitchen Remodeling',
            'services.kitchen.desc': 'Transform your kitchen into a modern and functional space. We specialize in custom cabinetry, countertops, and layouts.',
            'services.bathroom.title': 'Bathroom Remodeling',
            'services.bathroom.desc': 'Revamp your bathroom with stylish fixtures, beautiful tiles, and efficient layouts to create a spa-like retreat.',
            'services.interior.title': 'Stairs Remodeling & Construction',
            'services.interior.desc': 'Upgrade your home with custom stair remodeling and construction, built for safety, durability, and a refined finish.',
            'services.garden.title': 'Patio & Deck Remodeling',
            'services.garden.desc': 'Upgrade your outdoor space with professional patio and deck remodeling, built for style, durability, and comfort.',
            'gallery.title': 'Gallery',
            'contact.title': 'Contact Us',
            'contact.subtitle': 'Get in touch for a free consultation!',
            'contact.form.name': 'Name:',
            'contact.form.email': 'Email:',
            'contact.form.phone': 'Phone:',
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
            'services.subtitle': 'En Almonte Modern Living, ofrecemos una variedad de servicios de remodelación para transformar tu hogar. Aquí están algunas de nuestras ofertas principales:',
            'services.kitchen.title': 'Remodelación de Cocina',
            'services.kitchen.desc': 'Transforma tu cocina en un espacio moderno y funcional. Nos especializamos en gabinetes personalizados, encimeras y diseños.',
            'services.bathroom.title': 'Remodelación de Baño',
            'services.bathroom.desc': 'Renueva tu baño con accesorios elegantes, azulejos hermosos y diseños eficientes para crear un retiro estilo spa.',
            'services.interior.title': 'Remodelación y Construcción de Escaleras',
            'services.interior.desc': 'Mejora tu hogar con remodelación y construcción personalizada de escaleras, diseñada para seguridad, durabilidad y un acabado elegante.',
            'services.garden.title': 'Remodelación de Patio y Deck',
            'services.garden.desc': 'Renueva tu espacio exterior con remodelación profesional de patio y deck, diseñada para estilo, durabilidad y comodidad.',
            'gallery.title': 'Galería',
            'contact.title': 'Contáctanos',
            'contact.subtitle': '¡Ponte en contacto para una consulta gratuita!',
            'contact.form.name': 'Nombre:',
            'contact.form.email': 'Correo Electrónico:',
            'contact.form.phone': 'Teléfono:',
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

    // Only allow digits in phone input
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/\D/g, '');
        });
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyLanguage(btn.getAttribute('data-lang'));
        });
    });

    // Form submission via Formspree
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

    // Back to Top Button
    // Dynamic footer year
    document.getElementById('footer-year').textContent = new Date().getFullYear();

    // Back to Top Button
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

