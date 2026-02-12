
# diseño.md - Architect UI Premium Landing Generator

## 1. Análisis Psicológico y Estrategia Visual
* **Arquetipo de Marca:** **El Gobernante / El Creador.** La marca proyecta autoridad, solidez y la capacidad de delimitar y proteger la propiedad privada con estructuras de concreto.
* **Moodboard Virtual:** **Industrial, Robusto, Eficiente.** Se busca una estética que evoque la dureza del concreto pero con la limpieza de una gestión moderna y digital.
* **Justificación:** En el nicho de construcción de cercos, la confianza nace de la solidez visual. El uso de colores metálicos y óxidos (derivados del logo) combinados con una interfaz limpia de alta tecnología (v0/Tailwind) posiciona a Feramcer como una empresa que une la fuerza física con la eficiencia digital (cotización inmediata).

## 2. Sistema de Diseño (Tailwind CSS Specs)
* **Paleta de Colores:**
    * **Primary (Naranja Óxido):** `#C15930` (Ajustado para contraste). Tailwind: `orange-700`.
    * **Secondary (Gris Acero/Industrial):** `#3D3D3F`. Tailwind: `slate-700`.
    * **Accent (Turquesa Glacial del logo):** `#A3BCC2`. Tailwind: `cyan-200/30` para fondos sutiles.
    * **Backgrounds:** `bg-slate-50` (Modo Claro Premium con acentos en `slate-100`).
    * **Text:** `slate-900` para headings, `slate-600` para cuerpo.
* **Tipografía:**
    * **Headings:** `Inter` o `Montserrat`. Bold (700), Tracking tight (-0.02em).
    * **Body:** `Inter`. Regular (400), leading relaxed.
* **Estilos Globales:**
    * **Radio de Borde:** `rounded-2xl` para elementos de interfaz y `rounded-lg` para botones.
    * **Sombras:** `shadow-xl shadow-slate-200/50` para tarjetas de pasos.
    * **Efectos:** Bordes finos `border-slate-200`, gradientes lineales suaves de `white` a `slate-100`.

## 3. Instrucciones de Diseño por Sección

### 🔥 HERO SECTION
* **Layout:** Split layout (60/40). Izquierda: Texto y propuesta de valor. Derecha: Render de cerco de concreto de alta calidad o formulario destacado.
* **Elementos Visuales:** Fondo con un patrón sutil de cuadrícula de ingeniería. Badge superior: "Cotizador Inteligente v1.0".
* **Interacciones:** El botón CTA debe tener un efecto de brillo (pulse) suave.
* **Copywriting Vibe:** Directo, urgente, orientado a la eficiencia.

### 🧠 FORM SECTION (Floating Card)
* **Layout:** Card con `backdrop-blur-md` y borde `orange-500/20`. 
* **Visuales:** Iconos de WhatsApp en el botón de envío para reforzar el canal de entrega.
* **Copywriting Vibe:** Seguro y privado.

### 💥 SECCIÓN DIFERENCIAL
* **Layout:** 3-column Grid (o Bento Grid).
* **Visuales:** Iconografía minimalista en `orange-600`. Uso de "Checkmarks" verdes esmeralda para los bullets de valor.
* **Interacciones:** Hover `scale-105` suave en las cards.

### ⚙️ SECCIÓN “CÓMO FUNCIONA”
* **Layout:** Step-by-step horizontal con conectores de línea punteada.
* **Visuales:** Números grandes en `slate-200` de fondo detrás de cada paso. Iconografía industrial (mapa, mensaje, calendario).
* **Copywriting Vibe:** Claridad absoluta, proceso sin fricción.

### 🛡️ SECCIÓN CONFIANZA
* **Layout:** Alternancia de imagen (textura de concreto/obra) y texto.
* **Visuales:** Superposición de capas (imágenes con bordes redondeados y sombras profundas).
* **Copywriting Vibe:** Profesionalismo y garantía técnica.

### 🔁 CTA FINAL
* **Layout:** Full-width Banner con degradado de `slate-900` a `slate-800`.
* **Visuales:** Texto en blanco, botón en `orange-600` con texto blanco para máximo contraste.
* **Copywriting Vibe:** Cierre decisivo.

---

## 4. Prompt para el Generador de Código (Meta-Prompt)

> **Act as a Senior Frontend Developer. Build a high-conversion landing page for "Feramcer Constructora" using React, Tailwind CSS, and Lucide Icons. The niche is perimeter fencing (cercos de concreto). Use a professional color palette: Primary #C15930 (Orange Oxide), Secondary #3D3D3F (Steel Gray), and Background #F8FAFC. Design a Hero section with a split layout, a modern multi-step lead capture form, and a 'How it Works' section using a clean step-by-step UI. Use 'Inter' font, rounded-2xl corners, and subtle shadows for a premium, trustworthy feel. Ensure it is mobile-responsive and follows the provided structure: Hero, Form, Differentials, Process, Trust, and Final CTA. Use high-quality placeholders for construction images.**

---