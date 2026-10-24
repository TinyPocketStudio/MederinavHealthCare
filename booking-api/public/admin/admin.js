/* Mederinav – staff page. Talks to /admin/api/* (booking-api/src/admin.js). */
(function () {
  "use strict";

  const API = "/admin/api";
  const $ = (id) => document.getElementById(id);

  /* ---------- Language (Swedish / Spanish) ---------- */
  const TEXT = {
    sv: {
      days: ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"],
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      dayMonth: (d, m) => `${d} ${m}`,
      // Week label: "19–25 oktober 2026", or "28 september – 4 oktober 2026" across two months.
      weekRange: (d1, m1, d2, m2, y) => (m1 === m2 ? `${d1}–${d2} ${m2} ${y}` : `${d1} ${m1} – ${d2} ${m2} ${y}`),
      lang: "Språk", logout: "Logga ut", prevWeek: "Föregående vecka", nextWeek: "Nästa vecka", thisWeek: "Denna vecka",
      bookings: "Bokningar", showPractitioner: "Visa behandlare", allPractitioners: "Alla behandlare", showCancelled: "Visa avbokade",
      newBookingBtn: "+ Ny bokning", blockTime: "Blockera tid", loading: "Hämtar bokningar…", newBooking: "Ny bokning",
      "f.treatment": "Behandling", "f.practitioner": "Behandlare", "f.date": "Datum", "f.time": "Tid", "f.name": "Namn",
      "f.phone": "Telefon", "f.email": "E-post", optional: "(valfritt)", "f.mailLang": "Språk för mejl", swedish: "Svenska", spanish: "Spanska",
      "f.message": "Meddelande / anteckning", "f.sendConfirmation": "Skicka bekräftelse till patientens e-post",
      cancel: "Avbryt", saveBooking: "Spara bokning",
      blockHint: "Blockerad tid kan inte bokas på webben, t.ex. semester, sjukdom eller lunch.",
      "f.appliesTo": "Gäller", "f.fromDate": "Från datum", "f.toDate": "Till och med", allDay: "Hela dagen",
      "f.fromTime": "Från kl.", "f.toTime": "Till kl.", "f.note": "Anteckning", "f.noteExample": "(t.ex. Semester)", block: "Blockera",
      cancelTitle: "Avboka tiden?", notifyPatient: "Skicka avbokningsmejl till patienten",
      noEmail: "Patienten har ingen e-postadress – ring och meddela i stället.", keepBooking: "Behåll tiden", cancelBooking: "Avboka",
      authTitle: "Du är inte inloggad eller har inte behörighet.",
      authText: "Ladda om sidan och logga in med din e-postadress. Hör av dig till den som administrerar sidan om problemet kvarstår.",
      week: "Vecka", loadError: "Det gick inte att hämta bokningarna.", retry: "Försök igen", today: "Idag",
      nBookings: (n) => `${n} ${n === 1 ? "bokning" : "bokningar"}`, closed: "Stängt", noBookings: "Inga bokningar",
      noBookingsWeek: "Inga bokningar den här veckan.", bookedBy: (who) => `bokad av ${who}`, staff: "personal", bookedWeb: "bokad via webben",
      tagPhone: "Telefon", tagCancelled: "Avbokad", tagSpanish: "Spanska", cancelledBy: (who) => `avbokad av ${who}`,
      blocked: "Blockerad", by: (who) => `av ${who}`, remove: "Ta bort", wholeClinic: "Hela kliniken",
      labels: { name: "namn", phone: "telefon (minst 8 siffror)", email: "e-post", from: "från-datum", to: "till-datum", start: "från-tid", end: "till-tid", practitioner: "behandlare" },
      slotTaken: "Tiden är redan bokad eller blockerad. Välj en annan tid.", slotPast: "Tiden har redan passerat.",
      slotClosed: "Behandlaren arbetar inte den dagen, eller kliniken är stängd.", slotHours: "Tiden ligger utanför öppettiderna.",
      check: (list) => `Kontrollera: ${list}.`, notWorking: "Stängt / arbetar inte denna dag", taken: "upptagen", passed: "passerad",
      pickTime: "Välj en ledig tid.", saved: (ref) => `Bokningen sparades (${ref}).`, confirmationSent: " Bekräftelse skickas till patienten.",
      saveError: "Bokningen kunde inte sparas. Försök igen.",
      blockedDone: (n) => `Tiden är blockerad (${n} ${n === 1 ? "dag" : "dagar"}).`,
      conflicts: (n, list) => ` OBS: ${n} befintliga bokningar ligger i den tiden och är inte avbokade: ${list}.`,
      blockError: "Det gick inte att blockera tiden. Försök igen.",
      confirmUnblock: "Ta bort den blockerade tiden? Tiden blir bokningsbar igen.", unblocked: "Den blockerade tiden är borttagen.",
      unblockError: "Det gick inte att ta bort den blockerade tiden.",
      cancelSummary: (b) => `${b.name} – ${b.treatment}, ${b.date} kl. ${b.time} hos ${b.person} (${b.ref}).`,
      cancelledDone: (name, emailed) => `${name}s tid är avbokad.${emailed ? " Avbokningsmejl skickas." : ""} Tiden är bokningsbar igen.`,
      alreadyCancelled: "Bokningen är redan avbokad.", cancelError: "Det gick inte att avboka. Försök igen.",
      pageError: "Sidan kunde inte laddas. Kontrollera internetanslutningen och ladda om.",
      view: "Vy", treatments: "Behandlingar", newTreatmentBtn: "+ Ny behandling", newTreatment: "Ny behandling", editTreatment: "Ändra behandling",
      treatmentsHint: "Ändringar syns på webbplatsen inom en minut. Dolda behandlingar syns inte och kan inte bokas, men gamla bokningar finns kvar.",
      "f.tName": "Namn", "f.category": "Kategori", "f.duration": "Längd (minuter)", "f.price": "Pris (kr)",
      "f.performedBy": "Utförs av", "f.description": "Beskrivning", "f.suitable": "Passar dig som",
      "f.spanish": "Spanska texter", spanishHint: "Visas på den spanska webbplatsen. Fyll i en översättning av varje svensk text.",
      "f.hidden": "Dölj på webbplatsen", saveTreatment: "Spara behandling", edit: "Ändra",
      campaignPriceHint: "Kampanjpriset sätts på fliken Kampanj.",
      campaign: "Kampanj", "c.texts": "Texter och datum", "c.name": "Namn", "c.nameHint": "(t.ex. Höstkampanj – visas även som etikett på behandlingarna)",
      "c.title": "Rubrik", "c.titleHint": "(visas i kursiv stil efter namnet)", "c.startDate": "Startdatum", "c.endDate": "Slutdatum (sista dagen)",
      campaignHint: "Kampanjen visas på startsidan från startdatum till och med slutdatum. Behandlingar med kampanjpris visas med kampanjpriset på hela webbplatsen under den tiden.",
      "c.image": "Bild", "c.imageHint": "Liggande bild fungerar bäst. Den beskärs till bildytan på startsidan, så håll det viktigaste i mitten. Bilden sparas direkt när du väljer den.",
      "c.chooseImage": "Välj ny bild", "c.resetImage": "Använd standardbilden",
      "c.prices": "Behandlingar och kampanjpriser", "c.pricesHint": "Bocka i behandlingarna som ingår och skriv kampanjpriset. Det måste vara lägre än ordinarie pris.",
      "c.save": "Spara kampanj", campaignPricePlaceholder: "kr",campaignPriceFor: (name) => `Kampanjpris för ${name}`,
      stateNow: (end) => `pågår till och med ${end}`, stateSoon: (start) => `startar ${start}`, stateEnded: "avslutad",
      campaignSaved: "Kampanjen är sparad. Ändringarna syns på startsidan inom en minut.", campaignError: "Kampanjen kunde inte sparas. Försök igen.",
      missingPrice: (list) => `Skriv ett kampanjpris för: ${list}.`,
      imageSaving: "Sparar bilden…", imageSaved: "Bilden är sparad.", imageReset: "Standardbilden används igen.",
      imageError: "Bilden kunde inte sparas. Välj en JPG-, PNG- eller WebP-bild.", imageTooLarge: "Bilden är för stor. Välj en mindre bild.",
      gallery: "Före & efter", "g.showSection": "Visa Före & efter på startsidan", "g.newCaseBtn": "+ Nytt resultat",
      "g.hint": "Ett resultat visas på startsidan när det är publicerat, patienten har gett sitt samtycke och både före- och efterbild finns. Avsnittet visas bara när det är påslaget och minst ett resultat är publicerat.",
      "g.before": "Före", "g.after": "Efter", "g.noImage": "Ingen bild",
      "g.imageHint": "Använd bilder med samma utsnitt och format (helst liggande 4:3). Stora bilder förminskas automatiskt.",
      "g.title": "Rubrik", "g.category": "Filter", "g.detail": "Beskrivning", "g.detailHint": "(t.ex. Resultat 2 veckor efter behandling)",
      "g.consent": "Patienten har gett skriftligt samtycke till att bilderna publiceras", "g.visible": "Publicera på webbplatsen",
      "g.delete": "Ta bort", "g.save": "Spara", "g.newCase": "Nytt resultat", "g.editCase": "Ändra resultat",
      "g.empty": "Inga resultat ännu. Lägg till det första med ”+ Nytt resultat”.",
      tagPublished: "Publicerad", tagNotPublished: "Inte publicerad", tagNoConsent: "Samtycke saknas", tagMissingImage: "Bild saknas",
      moveUp: "Flytta upp", moveDown: "Flytta ned",
      sectionOn: "Före & efter visas på startsidan (när minst ett resultat är publicerat).", sectionOff: "Före & efter är dolt på startsidan.",
      sectionOnNoCases: "Påslaget, men inget resultat är publicerat ännu – avsnittet syns inte förrän ett är publicerat.",
      caseSaved: (title) => `”${title}” är sparat.`, caseDeleted: (title) => `”${title}” är borttaget.`,
      confirmDeleteCase: (title) => `Ta bort ”${title}” och båda bilderna för gott? Det går inte att ångra.`,
      caseError: "Resultatet kunde inte sparas. Försök igen.", galleryError: "Det gick inte att spara. Försök igen.",
      caseImageError: (side) => `${side === "before" ? "Före" : "Efter"}-bilden kunde inte användas. Välj en JPG-, PNG- eller WebP-bild.`,
      caseLabels: {
        title: "rubrik (2–80 tecken)", detail: "beskrivning (högst 120 tecken)", category: "filter",
        titleEs: "spansk rubrik", detailEs: "spansk beskrivning (krävs när den svenska är ifylld)",
        consent: "samtycke (krävs för att publicera)", before: "före-bild (krävs för att publicera)", after: "efter-bild (krävs för att publicera)",
      },
      campaignLabels: {
        name: "namn (2–60 tecken)", title: "rubrik (högst 120 tecken)", description: "beskrivning (högst 500 tecken)",
        nameEs: "spanskt namn", titleEs: "spansk rubrik (krävs när den svenska är ifylld)", descriptionEs: "spansk beskrivning (krävs när den svenska är ifylld)",
        startDate: "startdatum", endDate: "slutdatum (samma dag som startdatum eller senare)", prices: "kampanjpriser (lägre än ordinarie pris)",
      },
      tagHidden: "Dold", tagCampaign: (price) => `Kampanj ${price}`, nTreatments: (n) => `${n} ${n === 1 ? "behandling" : "behandlingar"}`,
      treatmentSaved: (name) => `”${name}” är sparad.`, treatmentError: "Behandlingen kunde inte sparas. Försök igen.",
      treatmentLabels: {
        name: "namn (2–80 tecken)", category: "kategori", duration: "längd (5–480 minuter)", price: "pris",
        practitioners: "utförs av (minst en)", description: "beskrivning",
        suitable: "passar dig som", nameEs: "spanskt namn", descriptionEs: "spansk beskrivning (krävs när den svenska är ifylld)",
        suitableEs: "spanskt ”passar dig som” (krävs när det svenska är ifyllt)",
      },
    },
    es: {
      days: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      dayMonth: (d, m) => `${d} de ${m}`,
      weekRange: (d1, m1, d2, m2, y) => (m1 === m2 ? `${d1}–${d2} de ${m2} de ${y}` : `${d1} de ${m1} – ${d2} de ${m2} de ${y}`),
      lang: "Idioma", logout: "Cerrar sesión", prevWeek: "Semana anterior", nextWeek: "Semana siguiente", thisWeek: "Esta semana",
      bookings: "Reservas", showPractitioner: "Mostrar profesional", allPractitioners: "Todos los profesionales", showCancelled: "Mostrar canceladas",
      newBookingBtn: "+ Nueva reserva", blockTime: "Bloquear horario", loading: "Cargando reservas…", newBooking: "Nueva reserva",
      "f.treatment": "Tratamiento", "f.practitioner": "Profesional", "f.date": "Fecha", "f.time": "Hora", "f.name": "Nombre",
      "f.phone": "Teléfono", "f.email": "Correo electrónico", optional: "(opcional)", "f.mailLang": "Idioma del correo", swedish: "Sueco", spanish: "Español",
      "f.message": "Mensaje / nota", "f.sendConfirmation": "Enviar confirmación al correo del paciente",
      cancel: "Cancelar", saveBooking: "Guardar reserva",
      blockHint: "El horario bloqueado no se puede reservar en la web, p. ej. vacaciones, enfermedad o almuerzo.",
      "f.appliesTo": "Aplica a", "f.fromDate": "Desde (fecha)", "f.toDate": "Hasta (incluido)", allDay: "Todo el día",
      "f.fromTime": "Desde las", "f.toTime": "Hasta las", "f.note": "Nota", "f.noteExample": "(p. ej. Vacaciones)", block: "Bloquear",
      cancelTitle: "¿Cancelar la cita?", notifyPatient: "Enviar correo de cancelación al paciente",
      noEmail: "El paciente no tiene correo electrónico: llámale para avisar.", keepBooking: "Mantener la cita", cancelBooking: "Cancelar cita",
      authTitle: "No has iniciado sesión o no tienes permiso.",
      authText: "Recarga la página e inicia sesión con tu correo electrónico. Si el problema continúa, contacta con quien administra la página.",
      week: "Semana", loadError: "No se pudieron cargar las reservas.", retry: "Reintentar", today: "Hoy",
      nBookings: (n) => `${n} ${n === 1 ? "reserva" : "reservas"}`, closed: "Cerrado", noBookings: "Sin reservas",
      noBookingsWeek: "No hay reservas esta semana.", bookedBy: (who) => `reservada por ${who}`, staff: "el personal", bookedWeb: "reservada en la web",
      tagPhone: "Teléfono", tagCancelled: "Cancelada", tagSpanish: "Español", cancelledBy: (who) => `cancelada por ${who}`,
      blocked: "Bloqueado", by: (who) => `por ${who}`, remove: "Eliminar", wholeClinic: "Toda la clínica",
      labels: { name: "nombre", phone: "teléfono (mín. 8 dígitos)", email: "correo", from: "fecha de inicio", to: "fecha final", start: "hora de inicio", end: "hora final", practitioner: "profesional" },
      slotTaken: "La hora ya está reservada o bloqueada. Elige otra hora.", slotPast: "La hora ya ha pasado.",
      slotClosed: "El profesional no trabaja ese día o la clínica está cerrada.", slotHours: "La hora está fuera del horario de apertura.",
      check: (list) => `Revisa: ${list}.`, notWorking: "Cerrado / no trabaja este día", taken: "ocupada", passed: "pasada",
      pickTime: "Elige una hora libre.", saved: (ref) => `Reserva guardada (${ref}).`, confirmationSent: " Se enviará la confirmación al paciente.",
      saveError: "No se pudo guardar la reserva. Inténtalo de nuevo.",
      blockedDone: (n) => `Horario bloqueado (${n} ${n === 1 ? "día" : "días"}).`,
      conflicts: (n, list) => ` Atención: ${n} reservas existentes están en ese horario y no se han cancelado: ${list}.`,
      blockError: "No se pudo bloquear el horario. Inténtalo de nuevo.",
      confirmUnblock: "¿Eliminar el bloqueo? El horario volverá a estar disponible.", unblocked: "Bloqueo eliminado.",
      unblockError: "No se pudo eliminar el bloqueo.",
      cancelSummary: (b) => `${b.name} – ${b.treatment}, ${b.date} a las ${b.time} con ${b.person} (${b.ref}).`,
      cancelledDone: (name, emailed) => `La cita de ${name} está cancelada.${emailed ? " Se enviará un correo de cancelación." : ""} El horario vuelve a estar disponible.`,
      alreadyCancelled: "La reserva ya está cancelada.", cancelError: "No se pudo cancelar. Inténtalo de nuevo.",
      pageError: "No se pudo cargar la página. Comprueba la conexión a internet y recarga.",
      view: "Vista", treatments: "Tratamientos", newTreatmentBtn: "+ Nuevo tratamiento", newTreatment: "Nuevo tratamiento", editTreatment: "Editar tratamiento",
      treatmentsHint: "Los cambios aparecen en la web en un minuto. Los tratamientos ocultos no se muestran ni se pueden reservar, pero las reservas antiguas se conservan.",
      "f.tName": "Nombre", "f.category": "Categoría", "f.duration": "Duración (minutos)", "f.price": "Precio (kr)",
      "f.performedBy": "Lo realiza", "f.description": "Descripción", "f.suitable": "Indicado para",
      "f.spanish": "Textos en español", spanishHint: "Se muestran en la web en español. Traduce cada texto sueco.",
      "f.hidden": "Ocultar en la web", saveTreatment: "Guardar tratamiento", edit: "Editar",
      campaignPriceHint: "El precio de campaña se fija en la pestaña Campaña.",
      campaign: "Campaña", "c.texts": "Textos y fechas", "c.name": "Nombre", "c.nameHint": "(p. ej. Campaña de otoño; también aparece como etiqueta en los tratamientos)",
      "c.title": "Título", "c.titleHint": "(se muestra en cursiva después del nombre)", "c.startDate": "Fecha de inicio", "c.endDate": "Fecha final (último día)",
      campaignHint: "La campaña se muestra en la página de inicio desde la fecha de inicio hasta la fecha final incluida. Durante ese tiempo, los tratamientos con precio de campaña muestran ese precio en toda la web.",
      "c.image": "Imagen", "c.imageHint": "Una imagen horizontal funciona mejor. Se recorta al espacio de la página de inicio, así que deja lo más importante en el centro. La imagen se guarda en cuanto la eliges.",
      "c.chooseImage": "Elegir nueva imagen", "c.resetImage": "Usar la imagen predeterminada",
      "c.prices": "Tratamientos y precios de campaña", "c.pricesHint": "Marca los tratamientos incluidos y escribe el precio de campaña. Debe ser menor que el precio normal.",
      "c.save": "Guardar campaña", campaignPricePlaceholder: "kr",campaignPriceFor: (name) => `Precio de campaña de ${name}`,
      stateNow: (end) => `en curso hasta el ${end}`, stateSoon: (start) => `empieza el ${start}`, stateEnded: "finalizada",
      campaignSaved: "Campaña guardada. Los cambios aparecen en la página de inicio en un minuto.", campaignError: "No se pudo guardar la campaña. Inténtalo de nuevo.",
      missingPrice: (list) => `Escribe un precio de campaña para: ${list}.`,
      imageSaving: "Guardando la imagen…", imageSaved: "Imagen guardada.", imageReset: "Se vuelve a usar la imagen predeterminada.",
      imageError: "No se pudo guardar la imagen. Elige una imagen JPG, PNG o WebP.", imageTooLarge: "La imagen es demasiado grande. Elige una más pequeña.",
      gallery: "Antes y después", "g.showSection": "Mostrar Antes y después en la página de inicio", "g.newCaseBtn": "+ Nuevo resultado",
      "g.hint": "Un resultado aparece en la página de inicio cuando está publicado, el paciente ha dado su consentimiento y hay imagen de antes y de después. La sección solo se muestra cuando está activada y hay al menos un resultado publicado.",
      "g.before": "Antes", "g.after": "Después", "g.noImage": "Sin imagen",
      "g.imageHint": "Usa imágenes con el mismo encuadre y formato (mejor horizontales 4:3). Las imágenes grandes se reducen automáticamente.",
      "g.title": "Título", "g.category": "Filtro", "g.detail": "Descripción", "g.detailHint": "(p. ej. Resultado 2 semanas después del tratamiento)",
      "g.consent": "El paciente ha dado su consentimiento por escrito para publicar las imágenes", "g.visible": "Publicar en la web",
      "g.delete": "Eliminar", "g.save": "Guardar", "g.newCase": "Nuevo resultado", "g.editCase": "Editar resultado",
      "g.empty": "Todavía no hay resultados. Añade el primero con «+ Nuevo resultado».",
      tagPublished: "Publicado", tagNotPublished: "No publicado", tagNoConsent: "Falta consentimiento", tagMissingImage: "Falta imagen",
      moveUp: "Subir", moveDown: "Bajar",
      sectionOn: "Antes y después se muestra en la página de inicio (cuando hay al menos un resultado publicado).", sectionOff: "Antes y después está oculto en la página de inicio.",
      sectionOnNoCases: "Activado, pero todavía no hay ningún resultado publicado: la sección no aparece hasta que se publique uno.",
      caseSaved: (title) => `«${title}» se ha guardado.`, caseDeleted: (title) => `«${title}» se ha eliminado.`,
      confirmDeleteCase: (title) => `¿Eliminar «${title}» y sus dos imágenes definitivamente? No se puede deshacer.`,
      caseError: "No se pudo guardar el resultado. Inténtalo de nuevo.", galleryError: "No se pudo guardar. Inténtalo de nuevo.",
      caseImageError: (side) => `No se pudo usar la imagen de ${side === "before" ? "antes" : "después"}. Elige una imagen JPG, PNG o WebP.`,
      caseLabels: {
        title: "título (2–80 caracteres)", detail: "descripción (máx. 120 caracteres)", category: "filtro",
        titleEs: "título en español", detailEs: "descripción en español (obligatoria si hay texto sueco)",
        consent: "consentimiento (necesario para publicar)", before: "imagen de antes (necesaria para publicar)", after: "imagen de después (necesaria para publicar)",
      },
      campaignLabels: {
        name: "nombre (2–60 caracteres)", title: "título (máx. 120 caracteres)", description: "descripción (máx. 500 caracteres)",
        nameEs: "nombre en español", titleEs: "título en español (obligatorio si hay texto sueco)", descriptionEs: "descripción en español (obligatoria si hay texto sueco)",
        startDate: "fecha de inicio", endDate: "fecha final (el mismo día que el inicio o después)", prices: "precios de campaña (menores que el precio normal)",
      },
      tagHidden: "Oculto", tagCampaign: (price) => `Campaña ${price}`, nTreatments: (n) => `${n} ${n === 1 ? "tratamiento" : "tratamientos"}`,
      treatmentSaved: (name) => `«${name}» se ha guardado.`, treatmentError: "No se pudo guardar el tratamiento. Inténtalo de nuevo.",
      treatmentLabels: {
        name: "nombre (2–80 caracteres)", category: "categoría", duration: "duración (5–480 minutos)", price: "precio",
        practitioners: "lo realiza (al menos uno)", description: "descripción",
        suitable: "indicado para", nameEs: "nombre en español", descriptionEs: "descripción en español (obligatoria si hay texto sueco)",
        suitableEs: "«indicado para» en español (obligatorio si hay texto sueco)",
      },
    },
  };
  const langKey = "mederinav-staff-lang";
  let lang = (() => {
    try { const saved = localStorage.getItem(langKey); if (TEXT[saved]) return saved; } catch (e) { /* ignore */ }
    return /^es\b/i.test(navigator.language) ? "es" : "sv";
  })();
  const L = () => TEXT[lang];
  const t = (key, ...args) => { const v = L()[key]; return typeof v === "function" ? v(...args) : v; };
  // Treatment / category names in the current language (Swedish is the default in data.js).
  const loc = (obj) => (lang !== "sv" && obj.es && obj.es.name) || obj.name;

  function applyStaticText() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll("[data-t-attr]").forEach((el) => {
      el.dataset.tAttr.split(";").forEach((pair) => { const [attr, key] = pair.split(":"); el.setAttribute(attr, t(key)); });
    });
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  /* ---------- Dates (local, as "YYYY-MM-DD") ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const monday = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const isoWeek = (d) => {
    const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
    return Math.ceil(((x - new Date(Date.UTC(x.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
  };
  const dayMonth = (d) => t("dayMonth", d.getDate(), L().months[d.getMonth()]);
  const longDate = (s) => { const d = parse(s); return `${L().days[d.getDay()]} ${dayMonth(d)}`; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- State ---------- */
  let config = null;
  let week = monday(new Date());
  let data = { bookings: [], blocks: [] };
  let loaded = false;
  let cancelling = null;
  const filterKey = "mederinav-staff-filter";

  const personName = (id) => (config.team.find((p) => p.id === id) || { name: id || t("wholeClinic") }).name;
  const treatments = () => config.categories.flatMap((c) => c.items);
  const treatmentById = (id) => treatments().find((x) => x.id === id);

  /* ---------- API ---------- */
  async function api(path, options = {}) {
    // FormData (pictures) sets its own Content-Type; everything else is JSON unless told otherwise.
    const isForm = options.body instanceof FormData;
    const res = await fetch(API + path, {
      ...options,
      headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) },
      credentials: "same-origin",
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) throw Object.assign(new Error("unauthorized"), { status: 401, body });
    if (!res.ok) throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status, body });
    return body;
  }

  function setStatus(text, isError, id = "status") {
    const el = $(id);
    el.textContent = text || "";
    el.classList.toggle("is-error", !!isError);
  }

  function showAuthError() {
    $("days").innerHTML = `<div class="day"><p><strong>${esc(t("authTitle"))}</strong></p>
      <p class="empty">${esc(t("authText"))}</p></div>`;
    document.querySelectorAll(".toolbar button, .toolbar select, .toolbar input").forEach((el) => { el.disabled = true; });
  }

  /* ---------- Week view ---------- */
  function renderWeekLabel() {
    const end = addDays(week, 6);
    const range = t("weekRange", week.getDate(), L().months[week.getMonth()], end.getDate(), L().months[end.getMonth()], end.getFullYear());
    $("week-label").innerHTML = `${esc(t("week"))} ${isoWeek(week)}<small>${esc(range)}</small>`;
  }

  async function loadWeek() {
    const from = ymd(week);
    const to = ymd(addDays(week, 6));
    renderWeekLabel();
    try {
      data = await api(`/bookings?from=${from}&to=${to}`);
      loaded = true;
      render();
    } catch (err) {
      if (err.status === 401) return showAuthError();
      $("days").innerHTML = `<div class="day"><p class="empty">${esc(t("loadError"))}</p>
        <button class="btn" type="button" id="retry">${esc(t("retry"))}</button></div>`;
      $("retry").addEventListener("click", loadWeek);
    }
  }

  function render() {
    const filter = $("filter").value;
    const showCancelled = $("show-cancelled").checked;
    const today = ymd(new Date());
    const html = [];

    for (let i = 0; i < 7; i++) {
      const date = ymd(addDays(week, i));
      const dow = addDays(week, i).getDay();
      const bookings = data.bookings.filter((b) => b.date === date && (!filter || b.practitionerId === filter) && (showCancelled || b.status === "confirmed"));
      const blocks = data.blocks.filter((b) => b.date === date && (!filter || !b.practitionerId || b.practitionerId === filter));
      const confirmed = bookings.filter((b) => b.status === "confirmed").length;
      const closed = !config.hours[dow];
      if (closed && !bookings.length && !blocks.length) continue; // hide closed days without anything on them

      const items = [
        ...blocks.map((b) => ({ start: b.start, html: blockItem(b) })),
        ...bookings.map((b) => ({ start: b.start, html: bookingItem(b) })),
      ].sort((a, b) => a.start - b.start);

      html.push(`<section class="day${date === today ? " is-today" : ""}" aria-labelledby="d-${date}">
        <h2 id="d-${date}">${esc(cap(longDate(date)))}${date === today ? ` <span class="badge-today">${esc(t("today"))}</span>` : ""}
          <span class="count">${esc(confirmed ? t("nBookings", confirmed) : closed ? t("closed") : t("noBookings"))}</span></h2>
        ${items.length ? `<ul class="items">${items.map((it) => it.html).join("")}</ul>` : ""}
      </section>`);
    }
    $("days").innerHTML = html.join("") || `<div class="day"><p class="empty">${esc(t("noBookingsWeek"))}</p></div>`;
  }

  function bookingItem(b) {
    const tr = treatmentById(b.treatmentId);
    const cancelled = b.status !== "confirmed";
    const who = b.source === "phone" ? t("bookedBy", esc(b.createdBy || t("staff"))) : t("bookedWeb");
    const contact = [
      b.phone ? `<a href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">${esc(b.phone)}</a>` : "",
      b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : "",
    ].filter(Boolean).join(" · ");
    return `<li class="item${cancelled ? " item--cancelled" : ""}">
      <div class="time">${hm(b.start)}<small>–${hm(b.end)}</small></div>
      <div class="body">
        <span><strong class="name">${esc(b.name)}</strong>${b.source === "phone" ? `<span class="tag">${esc(t("tagPhone"))}</span>` : ""}${cancelled ? `<span class="tag tag--cancelled">${esc(t("tagCancelled"))}</span>` : ""}${b.lang === "es" ? `<span class="tag">${esc(t("tagSpanish"))}</span>` : ""}</span>
        <span class="line">${esc(tr ? loc(tr) : b.treatmentId)} · ${esc(personName(b.practitionerId))}</span>
        ${contact ? `<span class="line">${contact}</span>` : ""}
        ${b.message ? `<span class="msg">”${esc(b.message)}”</span>` : ""}
        <span class="meta">${esc(b.reference)} · ${who}${cancelled && b.cancelledBy ? ` · ${t("cancelledBy", esc(b.cancelledBy))}` : ""}</span>
      </div>
      ${cancelled ? "" : `<button class="btn btn--small btn--danger-ghost" type="button" data-cancel="${esc(b.reference)}">${esc(t("cancelBooking"))}</button>`}
    </li>`;
  }

  function blockItem(b) {
    const allDay = b.start === 0 && b.end >= 1440;
    return `<li class="item item--block">
      <div class="time">${allDay ? esc(t("allDay")) : `${hm(b.start)}<small>–${hm(b.end)}</small>`}</div>
      <div class="body">
        <span><strong>${esc(t("blocked"))}</strong> · ${esc(personName(b.practitionerId))}</span>
        ${b.note ? `<span class="line">${esc(b.note)}</span>` : ""}
        ${b.createdBy ? `<span class="meta">${t("by", esc(b.createdBy))}</span>` : ""}
      </div>
      <button class="btn btn--small" type="button" data-delete-block="${b.id}">${esc(t("remove"))}</button>
    </li>`;
  }

  function fillFilter() {
    const keep = $("filter").value;
    $("filter").innerHTML = `<option value="">${esc(t("allPractitioners"))}</option>` + config.team.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    $("filter").value = keep;
  }

  /* ---------- Dialog helpers ---------- */
  function openDialog(dlg) {
    dlg.querySelector(".form-error").textContent = "";
    dlg.showModal();
  }
  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]") || e.target === dlg) dlg.close();
    });
  });
  const errorText = (err, fallback, labels = L().labels) => {
    if (err.body && err.body.error === "slot_taken") return t("slotTaken");
    if (err.body && err.body.error === "invalid_slot") {
      const r = err.body.reason;
      return r === "past" ? t("slotPast") : r === "closed" ? t("slotClosed") : t("slotHours");
    }
    if (err.body && err.body.fields) return t("check", err.body.fields.map((f) => labels[f] || f).join(", "));
    return fallback;
  };

  /* ---------- New phone booking ---------- */
  const fb = $("form-booking");
  let dayData = { date: "", bookings: [], blocks: [] };

  function fillTreatments() {
    const keep = fb.treatment.value;
    // Hidden treatments can't be booked.
    fb.treatment.innerHTML = config.categories.map((c) => {
      const items = c.items.filter((x) => !x.hidden);
      return items.length ? `<optgroup label="${esc(loc(c))}">${items.map((x) => `<option value="${x.id}">${esc(loc(x))} (${x.duration} min)</option>`).join("")}</optgroup>` : "";
    }).join("");
    if (keep) fb.treatment.value = keep;
  }
  function fillPractitioners() {
    const tr = treatmentById(fb.treatment.value);
    const keep = fb.practitioner.value;
    fb.practitioner.innerHTML = config.team.filter((p) => !tr || tr.practitioners.includes(p.id))
      .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    if ([...fb.practitioner.options].some((o) => o.value === keep)) fb.practitioner.value = keep;
  }
  async function loadDay() {
    const date = fb.date.value;
    if (!date) return;
    if (dayData.date !== date) {
      try {
        const d = await api(`/bookings?from=${date}&to=${date}`);
        dayData = { date, bookings: d.bookings, blocks: d.blocks };
      } catch (err) {
        dayData = { date, bookings: [], blocks: [] };
      }
    }
    fillTimes();
  }
  function fillTimes() {
    const tr = treatmentById(fb.treatment.value);
    const pid = fb.practitioner.value;
    const date = fb.date.value;
    const keep = fb.time.value;
    if (!tr || !pid || !date) { fb.time.innerHTML = ""; return; }
    const d = parse(date);
    const hours = config.hours[d.getDay()];
    const person = config.team.find((p) => p.id === pid);
    if (!hours || !person.days.includes(d.getDay())) {
      fb.time.innerHTML = `<option value="">${esc(t("notWorking"))}</option>`;
      return;
    }
    const now = new Date();
    const isToday = date === ymd(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const busy = [
      ...dayData.bookings.filter((b) => b.status === "confirmed" && b.practitionerId === pid),
      ...dayData.blocks.filter((b) => !b.practitionerId || b.practitionerId === pid),
    ];
    const opts = [];
    for (let m = toMin(hours[0]); m + tr.duration <= toMin(hours[1]); m += config.slotMinutes) {
      const taken = busy.some((b) => b.start < m + tr.duration && b.end > m);
      const past = isToday && m < nowMin;
      const label = `${hm(m)}–${hm(m + tr.duration)}${taken ? ` (${t("taken")})` : past ? ` (${t("passed")})` : ""}`;
      opts.push(`<option value="${hm(m)}"${taken || past ? " disabled" : ""}>${esc(label)}</option>`);
    }
    fb.time.innerHTML = opts.join("");
    if ([...fb.time.options].some((o) => o.value === keep && !o.disabled)) fb.time.value = keep;
    else { const first = [...fb.time.options].find((o) => !o.disabled); fb.time.value = first ? first.value : ""; }
  }

  $("open-booking").addEventListener("click", () => {
    fb.reset();
    fb.lang.value = lang;
    fillTreatments();
    fillPractitioners();
    const filter = $("filter").value;
    if (filter && [...fb.practitioner.options].some((o) => o.value === filter)) fb.practitioner.value = filter;
    const today = new Date();
    fb.date.value = ymd(week <= today && today <= addDays(week, 6) ? today : week);
    dayData = { date: "", bookings: [], blocks: [] };
    loadDay();
    openDialog($("dlg-booking"));
  });
  fb.treatment.addEventListener("change", () => { fillPractitioners(); fillTimes(); });
  fb.practitioner.addEventListener("change", fillTimes);
  fb.date.addEventListener("change", loadDay);
  fb.email.addEventListener("input", () => { if (fb.email.value.trim()) fb.sendConfirmation.checked = true; });

  fb.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = fb.querySelector(".form-error");
    if (!fb.time.value) { err.textContent = t("pickTime"); return; }
    const btn = fb.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const res = await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          treatment: fb.treatment.value, practitioner: fb.practitioner.value, date: fb.date.value, time: fb.time.value,
          name: fb.name.value, phone: fb.phone.value, email: fb.email.value, message: fb.message.value,
          lang: fb.lang.value, sendConfirmation: fb.sendConfirmation.checked,
        }),
      });
      $("dlg-booking").close();
      setStatus(t("saved", res.reference) + (fb.sendConfirmation.checked && fb.email.value ? t("confirmationSent") : ""));
      week = monday(parse(fb.date.value));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-booking").close(); return showAuthError(); }
      err.textContent = errorText(ex, t("saveError"));
      if (ex.body && ex.body.error === "slot_taken") { dayData.date = ""; loadDay(); }
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Block time ---------- */
  const fk = $("form-block");
  const syncAllDay = () => { fk.querySelector("[data-times]").hidden = fk.allDay.checked; };
  fk.allDay.addEventListener("change", syncAllDay);
  fk.from.addEventListener("change", () => { if (!fk.to.value || fk.to.value < fk.from.value) fk.to.value = fk.from.value; });

  function fillBlockPractitioners() {
    const keep = fk.practitioner.value;
    fk.practitioner.innerHTML = `<option value="">${esc(t("wholeClinic"))}</option>` + config.team.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    fk.practitioner.value = keep;
  }

  $("open-block").addEventListener("click", () => {
    fk.reset();
    fillBlockPractitioners();
    if ($("filter").value) fk.practitioner.value = $("filter").value;
    fk.from.value = ymd(new Date() < week ? week : new Date());
    fk.to.value = fk.from.value;
    syncAllDay();
    openDialog($("dlg-block"));
  });

  fk.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = fk.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const res = await api("/blocks", {
        method: "POST",
        body: JSON.stringify({
          practitioner: fk.practitioner.value, from: fk.from.value, to: fk.to.value || fk.from.value,
          allDay: fk.allDay.checked, start: fk.start.value, end: fk.end.value, note: fk.note.value,
        }),
      });
      $("dlg-block").close();
      let msg = t("blockedDone", res.created);
      if (res.conflicts.length) {
        msg += t("conflicts", res.conflicts.length, res.conflicts.map((c) => `${c.name} ${c.date} ${hm(c.start)} (${c.reference})`).join(", "));
      }
      setStatus(msg, res.conflicts.length > 0);
      week = monday(parse(fk.from.value));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-block").close(); return showAuthError(); }
      fk.querySelector(".form-error").textContent = errorText(ex, t("blockError"));
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Cancel / unblock (buttons in the list) ---------- */
  const fc = $("form-cancel");
  $("days").addEventListener("click", async (e) => {
    const cancelBtn = e.target.closest("[data-cancel]");
    if (cancelBtn) {
      cancelling = data.bookings.find((b) => b.reference === cancelBtn.dataset.cancel);
      if (!cancelling) return;
      const tr = treatmentById(cancelling.treatmentId);
      $("cancel-summary").textContent = t("cancelSummary", {
        name: cancelling.name, treatment: tr ? loc(tr) : "", date: longDate(cancelling.date),
        time: hm(cancelling.start), person: personName(cancelling.practitionerId), ref: cancelling.reference,
      });
      const hasEmail = !!cancelling.email;
      fc.querySelector("[data-notify]").hidden = !hasEmail;
      fc.querySelector("[data-no-email]").hidden = hasEmail;
      fc.notify.checked = hasEmail;
      openDialog($("dlg-cancel"));
      return;
    }
    const blockBtn = e.target.closest("[data-delete-block]");
    if (blockBtn) {
      if (!confirm(t("confirmUnblock"))) return;
      blockBtn.disabled = true;
      try {
        await api(`/blocks/${blockBtn.dataset.deleteBlock}`, { method: "DELETE" });
        setStatus(t("unblocked"));
        await loadWeek();
      } catch (ex) {
        if (ex.status === 401) return showAuthError();
        setStatus(t("unblockError"), true);
        blockBtn.disabled = false;
      }
    }
  });

  fc.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cancelling) return;
    const btn = fc.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const res = await api(`/bookings/${cancelling.reference}/cancel`, { method: "POST", body: JSON.stringify({ notify: fc.notify.checked }) });
      $("dlg-cancel").close();
      setStatus(t("cancelledDone", cancelling.name, res.emailed));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-cancel").close(); return showAuthError(); }
      fc.querySelector(".form-error").textContent = ex.status === 409 ? t("alreadyCancelled") : t("cancelError");
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Treatments (add / edit / hide) ---------- */
  const ft = $("form-treatment");
  let editing = null; // id of the treatment being edited, null = new
  const kr = (n) => `${new Intl.NumberFormat(lang === "es" ? "es-ES" : "sv-SE").format(n)} kr`;

  function renderTreatments() {
    $("treatment-list").innerHTML = config.categories.map((c) => `
      <section class="day" aria-labelledby="c-${esc(c.id)}">
        <h2 id="c-${esc(c.id)}">${esc(loc(c))} <span class="count">${esc(t("nTreatments", c.items.length))}</span></h2>
        ${c.items.length ? `<ul class="items">${c.items.map(treatmentItem).join("")}</ul>` : ""}
      </section>`).join("");
  }

  function treatmentItem(x) {
    return `<li class="item item--treatment${x.hidden ? " item--hidden" : ""}">
      <div class="time">${esc(kr(x.price))}<small>${x.duration} min</small></div>
      <div class="body">
        <span><strong class="name">${esc(loc(x))}</strong>${x.hidden ? `<span class="tag tag--cancelled">${esc(t("tagHidden"))}</span>` : ""}${x.campaignPrice != null ? `<span class="tag">${esc(t("tagCampaign", kr(x.campaignPrice)))}</span>` : ""}</span>
        <span class="line">${esc(x.practitioners.map(personName).join(", "))}</span>
      </div>
      <button class="btn btn--small" type="button" data-edit-treatment="${esc(x.id)}">${esc(t("edit"))}</button>
    </li>`;
  }

  function openTreatment(x) {
    editing = x ? x.id : null;
    ft.reset();
    $("dlg-treatment-title").textContent = t(x ? "editTreatment" : "newTreatment");
    ft.category.innerHTML = config.categories.map((c) => `<option value="${esc(c.id)}">${esc(loc(c))}</option>`).join("");
    $("treatment-practitioners").innerHTML = config.team.map((p) =>
      `<label class="check"><input type="checkbox" name="practitioners" value="${esc(p.id)}"> ${esc(p.name)}</label>`).join("");
    ft.querySelector("[data-edit-only]").hidden = !x;
    if (x) {
      const es = x.es || {};
      ft.name.value = x.name;
      ft.category.value = x.category;
      ft.duration.value = x.duration;
      ft.price.value = x.price;
      ft.querySelectorAll("[name=practitioners]").forEach((cb) => { cb.checked = x.practitioners.includes(cb.value); });
      ft.description.value = x.description || "";
      ft.suitable.value = x.suitable || "";
      ft.nameEs.value = es.name || "";
      ft.descriptionEs.value = es.description || "";
      ft.suitableEs.value = es.suitable || "";
      ft.hidden.checked = !!x.hidden;
    } else {
      ft.duration.value = 30;
      if (config.team.length === 1) ft.querySelector("[name=practitioners]").checked = true;
    }
    openDialog($("dlg-treatment"));
  }

  $("open-treatment").addEventListener("click", () => openTreatment(null));
  $("treatment-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-treatment]");
    if (btn) openTreatment(treatmentById(btn.dataset.editTreatment));
  });

  ft.addEventListener("submit", async (e) => {
    e.preventDefault();
    ft.querySelector(".form-error").textContent = "";
    const btn = ft.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const body = {
        name: ft.name.value, category: ft.category.value, duration: ft.duration.value, price: ft.price.value,
        practitioners: [...ft.querySelectorAll("[name=practitioners]:checked")].map((cb) => cb.value),
        description: ft.description.value, suitable: ft.suitable.value,
        es: { name: ft.nameEs.value, description: ft.descriptionEs.value, suitable: ft.suitableEs.value },
        hidden: editing ? ft.hidden.checked : false,
      };
      const res = editing
        ? await api(`/treatments/${encodeURIComponent(editing)}`, { method: "PUT", body: JSON.stringify(body) })
        : await api("/treatments", { method: "POST", body: JSON.stringify(body) });
      $("dlg-treatment").close();
      config = await api("/config");
      renderTreatments();
      if (campaignFilled) renderCampaignTreatments();
      setStatus(t("treatmentSaved", res.treatment.name), false, "t-status");
    } catch (ex) {
      if (ex.status === 401) { $("dlg-treatment").close(); return showAuthError(); }
      ft.querySelector(".form-error").textContent = errorText(ex, t("treatmentError"), L().treatmentLabels);
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Campaign (texts, dates, picture, campaign prices) ---------- */
  const fc2 = $("form-campaign");
  let campaignFilled = false; // filled once, so switching tabs never throws away unsaved changes
  // The default picture lives on the website, not on this staff page.
  const SITE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:5173" : "https://www.mederinavhealthcare.se";
  const shortDate = (s) => (s ? dayMonth(parse(s)) : "");

  function renderCampaignState() {
    const c = config.campaign;
    const today = ymd(new Date());
    const el = $("campaign-state");
    const ended = c.endDate && today > c.endDate;
    const soon = c.startDate && today < c.startDate;
    el.textContent = ended ? t("stateEnded") : soon ? t("stateSoon", shortDate(c.startDate)) : c.endDate ? t("stateNow", shortDate(c.endDate)) : "";
    el.classList.toggle("is-off", !!(ended || soon));
  }

  function renderCampaignImage() {
    const v = config.campaign.imageVersion;
    $("campaign-preview").src = v ? `/campaign-image?v=${encodeURIComponent(v)}` : `${SITE}/assets/images/campaign-season.svg`;
    $("campaign-image-reset").hidden = !v;
  }

  // Rows of treatments with a tick box and a campaign price. Keeps what is typed when redrawn (language switch).
  function renderCampaignTreatments() {
    const typed = {};
    fc2.querySelectorAll("[data-camp-price]").forEach((input) => {
      typed[input.dataset.campPrice] = { on: fc2.querySelector(`[data-camp-check="${input.dataset.campPrice}"]`).checked, price: input.value };
    });
    const fresh = !Object.keys(typed).length;
    $("campaign-treatments").innerHTML = config.categories.filter((c) => c.items.length).map((c) => `
      <p class="camp-group">${esc(loc(c))}</p>
      <div class="camp-list">${c.items.map((x) => {
        const state = fresh ? { on: x.campaignPrice != null, price: x.campaignPrice != null ? x.campaignPrice : "" } : typed[x.id] || { on: false, price: "" };
        return `<div class="camp-row" data-row="${esc(x.id)}">
          <label class="check"><input type="checkbox" data-camp-check="${esc(x.id)}"${state.on ? " checked" : ""}> ${esc(loc(x))}${x.hidden ? `<span class="tag tag--cancelled">${esc(t("tagHidden"))}</span>` : ""}</label>
          <span class="was">${esc(kr(x.price))}</span>
          <input class="input" type="number" min="0" step="1" inputmode="numeric" data-camp-price="${esc(x.id)}" value="${esc(state.price)}"
            placeholder="${esc(t("campaignPricePlaceholder"))}" aria-label="${esc(t("campaignPriceFor", loc(x)))}"${state.on ? "" : " disabled"}>
          <span class="pct" data-pct="${esc(x.id)}"></span>
        </div>`;
      }).join("")}</div>`).join("");
    treatments().forEach((x) => updatePct(x.id));
  }

  function updatePct(id) {
    const x = treatmentById(id);
    const input = fc2.querySelector(`[data-camp-price="${id}"]`);
    const out = fc2.querySelector(`[data-pct="${id}"]`);
    if (!x || !input || !out) return;
    const p = Number(input.value);
    out.textContent = !input.disabled && input.value !== "" && p >= 0 && p < x.price ? `−${Math.round((1 - p / x.price) * 100)}%` : "";
  }

  function fillCampaign() {
    const c = config.campaign;
    const es = c.es || {};
    fc2.name.value = c.name || "";
    fc2.title.value = c.title || "";
    fc2.description.value = c.description || "";
    fc2.nameEs.value = es.name || "";
    fc2.titleEs.value = es.title || "";
    fc2.descriptionEs.value = es.description || "";
    fc2.startDate.value = c.startDate || "";
    fc2.endDate.value = c.endDate || "";
    $("campaign-treatments").innerHTML = "";
    renderCampaignTreatments();
    renderCampaignImage();
    renderCampaignState();
    campaignFilled = true;
  }

  $("campaign-treatments").addEventListener("change", (e) => {
    const id = e.target.dataset.campCheck;
    if (!id) return;
    const input = fc2.querySelector(`[data-camp-price="${id}"]`);
    input.disabled = !e.target.checked;
    if (e.target.checked) input.focus();
    updatePct(id);
  });
  $("campaign-treatments").addEventListener("input", (e) => {
    if (e.target.dataset.campPrice) {
      e.target.closest(".camp-row").classList.remove("is-bad");
      updatePct(e.target.dataset.campPrice);
    }
  });

  fc2.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = fc2.querySelector(".form-error");
    err.textContent = "";
    setStatus("", false, "c-status");
    fc2.querySelectorAll(".camp-row.is-bad").forEach((r) => r.classList.remove("is-bad"));
    const prices = {};
    const missing = [];
    fc2.querySelectorAll("[data-camp-check]:checked").forEach((cb) => {
      const value = fc2.querySelector(`[data-camp-price="${cb.dataset.campCheck}"]`).value.trim();
      if (value === "") {
        missing.push(loc(treatmentById(cb.dataset.campCheck)));
        cb.closest(".camp-row").classList.add("is-bad");
      } else prices[cb.dataset.campCheck] = value;
    });
    if (missing.length) { err.textContent = t("missingPrice", missing.join(", ")); return; }
    const btn = fc2.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      await api("/campaign", {
        method: "PUT",
        body: JSON.stringify({
          name: fc2.name.value, title: fc2.title.value, description: fc2.description.value,
          es: { name: fc2.nameEs.value, title: fc2.titleEs.value, description: fc2.descriptionEs.value },
          startDate: fc2.startDate.value, endDate: fc2.endDate.value, prices,
        }),
      });
      config = await api("/config");
      fillCampaign();
      setStatus(t("campaignSaved"), false, "c-status");
    } catch (ex) {
      if (ex.status === 401) return showAuthError();
      ((ex.body && ex.body.badPrices) || []).forEach((id) => {
        const row = fc2.querySelector(`[data-row="${id}"]`);
        if (row) row.classList.add("is-bad");
      });
      err.textContent = errorText(ex, t("campaignError"), L().campaignLabels);
    } finally {
      btn.disabled = false;
    }
  });

  // Photos from phones are large: shrink to at most 1600 px and save as WebP (or JPEG) before uploading.
  async function shrinkImage(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await toBlob("image/webp", 0.85);
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85);
    if (blob && blob.size > 1400000) blob = await toBlob("image/jpeg", 0.7);
    return blob;
  }

  $("campaign-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setStatus(t("imageSaving"), false, "image-status");
    try {
      const blob = await shrinkImage(file);
      const res = await api("/campaign/image", { method: "PUT", body: blob, headers: { "Content-Type": blob.type } });
      config.campaign.imageVersion = res.imageVersion;
      renderCampaignImage();
      setStatus(t("imageSaved"), false, "image-status");
    } catch (ex) {
      if (ex.status === 401) return showAuthError();
      setStatus(t(ex.status === 413 ? "imageTooLarge" : "imageError"), true, "image-status");
    }
  });

  $("campaign-image-reset").addEventListener("click", async () => {
    try {
      await api("/campaign/image", { method: "DELETE" });
      config.campaign.imageVersion = null;
      renderCampaignImage();
      setStatus(t("imageReset"), false, "image-status");
    } catch (ex) {
      if (ex.status === 401) return showAuthError();
      setStatus(t("imageError"), true, "image-status");
    }
  });

  /* ---------- Before & after gallery ---------- */
  const fg = $("form-case");
  let gallery = null; // { visible, cases, categories } from /gallery, loaded when the tab is first opened
  let editingCase = null;
  const picked = { before: null, after: null }; // shrunk pictures waiting to be saved
  const caseThumb = (c, side) => (c[`${side}Version`] ? `${API}/gallery/${c.id}/${side}?v=${encodeURIComponent(c[`${side}Version`])}` : "");
  const galleryCategoryName = (id) => { const g = gallery.categories.find((x) => x.id === id); return g ? loc(g) : id; };
  const locText = (c, field) => (lang !== "sv" && c.es && c.es[field]) || c[field];

  async function loadGallery() {
    try {
      gallery = await api("/gallery");
      renderGallery();
    } catch (err) {
      if (err.status === 401) return showAuthError();
      $("case-list").innerHTML = `<div class="day"><p class="empty">${esc(t("pageError"))}</p></div>`;
    }
  }

  function renderGalleryState() {
    const published = gallery.cases.some((c) => c.visible && c.consent && c.beforeVersion && c.afterVersion);
    $("gallery-visible").checked = gallery.visible;
    setStatus(!gallery.visible ? t("sectionOff") : published ? t("sectionOn") : t("sectionOnNoCases"), false, "g-status");
  }

  function renderGallery() {
    renderGalleryState();
    if (!gallery.cases.length) {
      $("case-list").innerHTML = `<div class="day"><p class="empty">${esc(t("g.empty"))}</p></div>`;
      return;
    }
    $("case-list").innerHTML = `<div class="day"><ul class="cases">${gallery.cases.map((c, i) => {
      const missing = !c.beforeVersion || !c.afterVersion;
      const live = c.visible && c.consent && !missing;
      const tags = [
        live ? `<span class="tag tag--ok">${esc(t("tagPublished"))}</span>` : `<span class="tag tag--cancelled">${esc(t("tagNotPublished"))}</span>`,
        !c.consent ? `<span class="tag tag--cancelled">${esc(t("tagNoConsent"))}</span>` : "",
        missing ? `<span class="tag tag--cancelled">${esc(t("tagMissingImage"))}</span>` : "",
      ].join("");
      const thumb = (side) => (caseThumb(c, side) ? `<span><img src="${esc(caseThumb(c, side))}" alt="${esc(t(`g.${side}`))}" loading="lazy"></span>` : `<span>${esc(t("g.noImage"))}</span>`);
      return `<li class="case${live ? "" : " case--off"}">
        <div class="case-thumbs">${thumb("before")}${thumb("after")}</div>
        <div class="body">
          <span><strong>${esc(locText(c, "title"))}</strong>${tags}</span>
          <span class="line">${esc(galleryCategoryName(c.category))}${c.detail ? ` · ${esc(locText(c, "detail"))}` : ""}</span>
        </div>
        <div class="case-buttons">
          <button class="btn btn--small btn--icon" type="button" data-move-case="${c.id}" data-dir="-1" aria-label="${esc(t("moveUp"))}"${i === 0 ? " disabled" : ""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg></button>
          <button class="btn btn--small btn--icon" type="button" data-move-case="${c.id}" data-dir="1" aria-label="${esc(t("moveDown"))}"${i === gallery.cases.length - 1 ? " disabled" : ""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
          <button class="btn btn--small" type="button" data-edit-case="${c.id}">${esc(t("edit"))}</button>
        </div>
      </li>`;
    }).join("")}</ul></div>`;
  }

  function setPreview(side, src) {
    fg.querySelector(`[data-preview="${side}"]`).src = src || "";
  }

  function openCase(c) {
    editingCase = c;
    picked.before = null;
    picked.after = null;
    fg.reset();
    $("dlg-case-title").textContent = t(c ? "g.editCase" : "g.newCase");
    fg.category.innerHTML = gallery.categories.map((g) => `<option value="${esc(g.id)}">${esc(loc(g))}</option>`).join("");
    $("delete-case").hidden = !c;
    if (c) {
      fg.title.value = c.title;
      fg.category.value = c.category;
      fg.detail.value = c.detail || "";
      fg.titleEs.value = (c.es && c.es.title) || "";
      fg.detailEs.value = (c.es && c.es.detail) || "";
      fg.consent.checked = c.consent;
      fg.visible.checked = c.visible;
    }
    setPreview("before", c ? caseThumb(c, "before") : "");
    setPreview("after", c ? caseThumb(c, "after") : "");
    openDialog($("dlg-case"));
  }

  ["before", "after"].forEach((side) => {
    fg[side].addEventListener("change", async () => {
      const file = fg[side].files[0];
      if (!file) return;
      fg.querySelector(".form-error").textContent = "";
      try {
        picked[side] = await shrinkImage(file);
        setPreview(side, URL.createObjectURL(picked[side]));
      } catch (e) {
        picked[side] = null;
        fg.querySelector(".form-error").textContent = t("caseImageError", side);
      }
    });
  });

  $("open-case").addEventListener("click", () => openCase(null));
  $("case-list").addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit-case]");
    if (edit) return openCase(gallery.cases.find((c) => c.id === Number(edit.dataset.editCase)));
    const move = e.target.closest("[data-move-case]");
    if (!move) return;
    move.disabled = true;
    try {
      await api(`/gallery/${move.dataset.moveCase}/move`, { method: "POST", body: JSON.stringify({ direction: Number(move.dataset.dir) }) });
      await loadGallery();
    } catch (ex) {
      if (ex.status === 401) return showAuthError();
      setStatus(t("galleryError"), true, "g-status");
    }
  });

  $("gallery-visible").addEventListener("change", async (e) => {
    const visible = e.target.checked;
    try {
      await api("/gallery/settings", { method: "PUT", body: JSON.stringify({ visible }) });
      gallery.visible = visible;
      renderGalleryState();
    } catch (ex) {
      e.target.checked = !visible;
      if (ex.status === 401) return showAuthError();
      setStatus(t("galleryError"), true, "g-status");
    }
  });

  fg.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = fg.querySelector(".form-error");
    err.textContent = "";
    const form = new FormData();
    ["title", "category", "detail", "titleEs", "detailEs"].forEach((name) => form.append(name, fg[name].value));
    form.append("consent", String(fg.consent.checked));
    form.append("visible", String(fg.visible.checked));
    ["before", "after"].forEach((side) => { if (picked[side]) form.append(side, picked[side], `${side}.${picked[side].type.split("/")[1]}`); });
    const btn = fg.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const res = editingCase
        ? await api(`/gallery/${editingCase.id}`, { method: "PUT", body: form })
        : await api("/gallery", { method: "POST", body: form });
      $("dlg-case").close();
      await loadGallery();
      setStatus(t("caseSaved", res.case.title), false, "g-status");
    } catch (ex) {
      if (ex.status === 401) { $("dlg-case").close(); return showAuthError(); }
      err.textContent = ex.body && ex.body.side ? t("caseImageError", ex.body.side) : errorText(ex, t("caseError"), L().caseLabels);
    } finally {
      btn.disabled = false;
    }
  });

  $("delete-case").addEventListener("click", async () => {
    if (!editingCase || !confirm(t("confirmDeleteCase", editingCase.title))) return;
    try {
      await api(`/gallery/${editingCase.id}`, { method: "DELETE" });
      $("dlg-case").close();
      await loadGallery();
      setStatus(t("caseDeleted", editingCase.title), false, "g-status");
    } catch (ex) {
      if (ex.status === 401) { $("dlg-case").close(); return showAuthError(); }
      fg.querySelector(".form-error").textContent = t("galleryError");
    }
  });

  /* ---------- Views: Bokningar | Behandlingar | Kampanj | Före & efter ---------- */
  const viewKey = "mederinav-staff-view";
  function showView(view) {
    $("view-bookings").hidden = view !== "bookings";
    $("view-treatments").hidden = view !== "treatments";
    $("view-campaign").hidden = view !== "campaign";
    $("view-gallery").hidden = view !== "gallery";
    document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    if (view === "treatments" && config) renderTreatments();
    if (view === "campaign" && config && !campaignFilled) fillCampaign();
    if (view === "gallery" && !gallery) loadGallery();
    try { localStorage.setItem(viewKey, view); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll("[data-view]").forEach((btn) => btn.addEventListener("click", () => showView(btn.dataset.view)));

  /* ---------- Toolbar ---------- */
  $("prev").addEventListener("click", () => { week = addDays(week, -7); setStatus(""); loadWeek(); });
  $("next").addEventListener("click", () => { week = addDays(week, 7); setStatus(""); loadWeek(); });
  $("this-week").addEventListener("click", () => { week = monday(new Date()); setStatus(""); loadWeek(); });
  $("filter").addEventListener("change", () => { try { localStorage.setItem(filterKey, $("filter").value); } catch (e) { /* ignore */ } render(); });
  $("show-cancelled").addEventListener("change", render);

  // SV / ES switch: re-translate everything on the page without reloading.
  document.querySelectorAll("[data-lang]").forEach((btn) => btn.addEventListener("click", () => {
    if (btn.dataset.lang === lang) return;
    lang = btn.dataset.lang;
    try { localStorage.setItem(langKey, lang); } catch (e) { /* ignore */ }
    applyStaticText();
    setStatus("");
    setStatus("", false, "t-status");
    if (!config) return;
    fillFilter();
    renderWeekLabel();
    if (loaded) render();
    if (!$("view-treatments").hidden) renderTreatments();
    if (campaignFilled) { renderCampaignTreatments(); renderCampaignState(); }
    if (gallery) renderGallery();
    if ($("dlg-booking").open) { fillTreatments(); fillTimes(); }
    if ($("dlg-block").open) fillBlockPractitioners();
  }));

  /* ---------- Start ---------- */
  applyStaticText();
  (async function init() {
    try {
      const [me, cfg] = await Promise.all([api("/me"), api("/config")]);
      config = cfg;
      $("who").textContent = me.email;
      fillFilter();
      try { const saved = localStorage.getItem(filterKey); if (saved && config.team.some((p) => p.id === saved)) $("filter").value = saved; } catch (e) { /* ignore */ }
      try { const v = localStorage.getItem(viewKey); if (v === "treatments" || v === "campaign" || v === "gallery") showView(v); } catch (e) { /* ignore */ }
      await loadWeek();
    } catch (err) {
      if (err.status === 401) return showAuthError();
      $("days").innerHTML = `<div class="day"><p class="empty">${esc(t("pageError"))}</p></div>`;
    }
  })();
})();
