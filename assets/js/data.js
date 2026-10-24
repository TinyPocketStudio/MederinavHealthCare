/*
 * Mederinav Health Care – innehållsdata
 * ------------------------------------------------------------
 * Redigera behandlingar, priser, behandlare och öppettider här.
 * Sidorna Behandlingar och Boka tid läser allt från denna fil.
 * Alla texter och priser nedan är EXEMPEL/PLATSHÅLLARE – byt ut innan lansering.
 *
 * Spanska: blocken `es: { … }` innehåller den spanska versionen av texten bredvid.
 * Ändrar du en svensk text, uppdatera även den spanska. Saknas ett fält visas svenskan.
 */
window.MEDERINAV = {
  clinic: {
    name: "Mederinav Health Care",
    phone: "+46737515457",
    phoneDisplay: "073-751 54 57",
    email: "kundservice@mederinavhealthcare.se",
    address: "Sjödalsvägen 18, 141 47 Huddinge",
  },

  // Behandlare. `days` = veckodagar de arbetar (1 = måndag … 6 = lördag, 0 = söndag).
  team: [
    { id: "christian", name: "Christian Navarro", role: "Läkare", es: { role: "Médico" }, days: [1, 2, 3, 4, 5] },
    { id: "lorena", name: "Lorena Munoz", role: "Medicinsk fotterapeut & sjuksköterska", es: { role: "Podóloga clínica y enfermera" }, days: [2, 3, 4, 5, 6] },
  ],

  // Öppettider per veckodag: [öppnar, stänger] eller null = stängt.
  hours: {
    1: ["10:00", "17:00"],
    2: ["10:00", "18:00"],
    3: ["10:00", "18:00"],
    4: ["10:00", "18:00"],
    5: ["10:00", "18:30"],
    6: ["11:00", "14:00"],
    0: null,
  },
  slotMinutes: 30,       // Intervall mellan bokningsbara starttider
  bookingWeeksAhead: 8,  // Hur många veckor framåt man kan boka
  minNoticeHours: 2,     // Minsta framförhållning för en bokning

  // Bokningssystemet (mappen booking-api/). När sidan öppnas lokalt (localhost)
  // används automatiskt testservern på http://localhost:8787 i stället.
  // OBS: bokningssystemet läser också den här filen – ändringar här gäller båda.
  // turnstileSiteKey: robotkontrollen på bokningsformuläret (Cloudflare Turnstile).
  // Nyckeln är offentlig och får ligga här – den hemliga nyckeln finns bara i Cloudflare.
  booking: { apiBase: "https://api.mederinavhealthcare.se", turnstileSiteKey: "0x4AAAAAAFfLN3KU1XMYM3HH" },

  // Säsongskampanj – rabatterade behandlingar visas med kampanjpris.
  campaign: {
    name: "Höstkampanj",
    es: { name: "Campaña de otoño" },
    endDate: "2026-11-30",
  },

  // Behandlingar hanteras nu på personalsidan (fliken Behandlingar) och sparas i databasen.
  // Behandlingarna nedan används bara för att fylla databasen första gången, och som reserv
  // om bokningssystemet inte svarar. Kategoriernas namn och introtexter ändras fortfarande här.
  categories: [
    {
      id: "medicinskt",
      name: "Läkarbesök & medicinskt",
      intro: "Läkarbesök, konsultationer och medicinska behandlingar hos legitimerad läkare.",
      es: { name: "Visitas médicas y tratamientos médicos", intro: "Visitas y consultas médicas, y tratamientos médicos realizados por un médico con licencia." },
      items: [
        {
          id: "lakarbesok",
          name: "Läkarbesök",
          duration: 30,
          price: 1400,
          practitioners: ["christian"],
          description: "Ett läkarbesök där läkaren undersöker och bedömer dina besvär. Vid behov får du råd om fortsatt behandling eller en remiss.",
          suitable: "Dig som behöver träffa en läkare för ett hälsoproblem eller en medicinsk bedömning.",
          es: {
            name: "Visita médica",
            description: "Una visita en la que el médico te examina y evalúa tus molestias. Si es necesario, recibes recomendaciones sobre el tratamiento a seguir o una derivación.",
            suitable: "Personas que necesitan ver a un médico por un problema de salud o una evaluación médica.",
          },
        },
        {
          id: "lakarkonsultation",
          name: "Läkarkonsultation",
          duration: 30,
          price: 3400,
          practitioners: ["christian"],
          description: "Ett personligt samtal med läkaren där ni går igenom dina önskemål och din hälsohistorik inför en behandling och tar fram en behandlingsplan.",
          suitable: "Dig som vill ha en grundlig genomgång och en personlig plan innan du påbörjar en behandling.",
          es: {
            name: "Consulta médica",
            description: "Una conversación personal con el médico en la que revisáis tus deseos y tu historial de salud antes de un tratamiento y elaboráis un plan de tratamiento.",
            suitable: "Personas que desean una evaluación detallada y un plan personalizado antes de empezar un tratamiento.",
          },
        },
        {
          id: "aderbrack",
          name: "Åderbråcksbehandling",
          duration: 45,
          price: 2500,
          practitioners: ["christian"],
          description: "Behandling av åderbråck efter en medicinsk bedömning. Läkaren går igenom vilken metod som passar dig och vad du kan förvänta dig av resultatet.",
          suitable: "Dig som besväras av synliga eller ömmande åderbråck på benen.",
          es: {
            name: "Tratamiento de varices",
            description: "Tratamiento de las varices tras una evaluación médica. El médico te explica qué método es el adecuado para ti y qué resultado puedes esperar.",
            suitable: "Personas a las que les molestan varices visibles o dolorosas en las piernas.",
          },
        },
        {
          id: "vitamindropp",
          name: "Vitamindropp",
          duration: 45,
          price: 1500,
          practitioners: ["christian"],
          description: "Vitaminer och mineraler som ges via dropp, efter en läkarbedömning av att behandlingen passar dig.",
          suitable: "Dig som efter samråd med läkaren vill komplettera ditt intag av vitaminer och mineraler.",
          es: {
            name: "Goteo de vitaminas",
            description: "Vitaminas y minerales administrados por vía intravenosa, tras una evaluación médica que confirme que el tratamiento es adecuado para ti.",
            suitable: "Personas que, tras consultarlo con el médico, desean complementar su aporte de vitaminas y minerales.",
          },
        },
      ],
    },
    {
      id: "injektioner",
      name: "Injektioner",
      intro: "Botox och fillers för ett naturligt och utvilat uttryck – alltid utförda av läkare.",
      es: { name: "Inyecciones", intro: "Botox y rellenos para un aspecto natural y descansado, siempre aplicados por un médico." },
      items: [
        {
          id: "botox-bekymmersrynka",
          name: "Botox – bekymmersrynka",
          duration: 15,
          price: 1500,
          campaignPrice: 1200, // 20 % rabatt
          practitioners: ["christian"],
          description: "Botox mjukar upp bekymmersrynkan mellan ögonbrynen. Effekten kommer efter några dagar och håller i regel 3–4 månader.",
          suitable: "Dig som vill mjuka upp den lodräta rynkan mellan ögonbrynen.",
          es: {
            name: "Botox – entrecejo",
            description: "El botox suaviza la arruga del entrecejo, entre las cejas. El efecto aparece a los pocos días y suele durar entre 3 y 4 meses.",
            suitable: "Personas que desean suavizar la arruga vertical entre las cejas.",
          },
        },
        {
          id: "botox-2",
          name: "Botox – två områden",
          duration: 15,
          price: 2500,
          campaignPrice: 2000, // 20 % rabatt
          practitioners: ["christian"],
          description: "Behandling av två områden vid samma besök, till exempel panna och bekymmersrynka, för ett harmoniskt resultat.",
          suitable: "Dig som vill mjuka upp mimikrynkor i två närliggande områden.",
          es: {
            name: "Botox – dos zonas",
            description: "Tratamiento de dos zonas en la misma visita, por ejemplo la frente y el entrecejo, para un resultado armonioso.",
            suitable: "Personas que desean suavizar las arrugas de expresión en dos zonas cercanas.",
          },
        },
        {
          id: "botox-3",
          name: "Botox – tre områden",
          duration: 15,
          price: 3000,
          campaignPrice: 2400, // 20 % rabatt
          practitioners: ["christian"],
          description: "Helhetsbehandling av panna, bekymmersrynka och kråksparkar vid ett och samma besök.",
          suitable: "Dig som vill ha en balanserad föryngring av hela övre delen av ansiktet.",
          es: {
            name: "Botox – tres zonas",
            description: "Tratamiento completo de la frente, el entrecejo y las patas de gallo en una sola visita.",
            suitable: "Personas que desean un rejuvenecimiento equilibrado de toda la parte superior del rostro.",
          },
        },
        {
          id: "fillers-lappar",
          name: "Fillerbehandling – läppar",
          duration: 15,
          price: 1800,
          campaignPrice: 1440, // 20 % rabatt
          practitioners: ["christian"],
          description: "Hyaluronsyra ger läpparna mer volym, en tydligare kontur eller jämnare symmetri, med ett mjukt och naturligt resultat.",
          suitable: "Dig som vill ha fylligare, mer definierade eller mer symmetriska läppar.",
          es: {
            name: "Relleno de labios",
            description: "El ácido hialurónico aporta a los labios más volumen, un contorno más definido o una simetría más uniforme, con un resultado suave y natural.",
            suitable: "Personas que desean unos labios más carnosos, definidos o simétricos.",
          },
        },
        {
          id: "radiesse",
          name: "Radiesse",
          duration: 30,
          price: 3500,
          practitioners: ["christian"],
          description: "Radiesse är en filler som ger volym och lyft, till exempel vid kindben och käklinje, och som även stimulerar hudens egen kollagenbildning.",
          suitable: "Dig som vill återställa volym och ge ansiktet en fastare kontur.",
          es: {
            name: "Radiesse",
            description: "Radiesse es un relleno que aporta volumen y efecto lifting, por ejemplo en pómulos y mandíbula, y que además estimula la producción de colágeno propia de la piel.",
            suitable: "Personas que desean recuperar volumen y dar al rostro un contorno más firme.",
          },
        },
        {
          id: "nefertiti-lift",
          name: "Nefertiti lift",
          duration: 30,
          price: 3000,
          practitioners: ["christian"],
          description: "Botox i halsens muskler och längs käklinjen för en tydligare käklinje och en slätare hals.",
          suitable: "Dig som vill ha en mer definierad käklinje och mjuka upp linjer på halsen.",
          es: {
            name: "Nefertiti lift",
            description: "Botox en los músculos del cuello y a lo largo de la mandíbula para una línea mandibular más definida y un cuello más liso.",
            suitable: "Personas que desean una mandíbula más definida y suavizar las líneas del cuello.",
          },
        },
      ],
    },
    {
      id: "hudvard",
      name: "Hudvård",
      intro: "Behandlingar som förnyar och återfuktar huden – för en fräschare och jämnare hy.",
      es: { name: "Cuidado de la piel", intro: "Tratamientos que renuevan e hidratan la piel, para un cutis más fresco y uniforme." },
      items: [
        {
          id: "prp",
          name: "PRP-behandling",
          duration: 45,
          price: 1800,
          practitioners: ["christian"],
          description: "PRP (blodplättsrik plasma) framställs från ditt eget blod och injiceras i huden för att stimulera hudens förnyelse.",
          suitable: "Dig som vill förbättra hudens lyster och struktur med en behandling baserad på kroppens egna ämnen.",
          es: {
            name: "Tratamiento PRP",
            description: "El PRP (plasma rico en plaquetas) se obtiene de tu propia sangre y se inyecta en la piel para estimular su renovación.",
            suitable: "Personas que desean mejorar la luminosidad y la textura de la piel con un tratamiento basado en sustancias del propio cuerpo.",
          },
        },
        {
          id: "prp-har",
          name: "PRP-behandling för hår",
          duration: 45,
          price: 2000,
          practitioners: ["christian"],
          description: "PRP från ditt eget blod injiceras i hårbotten för att stimulera hårsäckarna. Ofta görs en serie behandlingar.",
          suitable: "Dig med tunnare hår eller begynnande håravfall.",
          es: {
            name: "Tratamiento PRP capilar",
            description: "El PRP obtenido de tu propia sangre se inyecta en el cuero cabelludo para estimular los folículos pilosos. Suele realizarse una serie de sesiones.",
            suitable: "Personas con cabello más fino o caída del cabello incipiente.",
          },
        },
        {
          id: "microneedling",
          name: "Microneedling med vitaminer",
          duration: 15,
          price: 1500,
          practitioners: ["christian"],
          description: "Små, fina nålar stimulerar huden samtidigt som ett vitaminserum tillförs, för en jämnare och fräschare hy.",
          suitable: "Dig som vill förbättra hudens struktur, porer eller lyster.",
          es: {
            name: "Microneedling con vitaminas",
            description: "Pequeñas agujas finas estimulan la piel mientras se aplica un sérum de vitaminas, para un cutis más uniforme y fresco.",
            suitable: "Personas que desean mejorar la textura, los poros o la luminosidad de la piel.",
          },
        },
        {
          id: "hydrafacial",
          name: "Hydrafacial – djup rengöring",
          duration: 60,
          price: 1500,
          practitioners: ["christian"],
          description: "En djuprengörande ansiktsbehandling som rengör, exfolierar och återfuktar huden i flera steg.",
          suitable: "Dig som vill ha en ren, återfuktad och lysterfull hy – passar de flesta hudtyper.",
          es: {
            name: "Hydrafacial – limpieza profunda",
            description: "Un tratamiento facial de limpieza profunda que limpia, exfolia e hidrata la piel en varios pasos.",
            suitable: "Personas que desean una piel limpia, hidratada y luminosa; apto para la mayoría de los tipos de piel.",
          },
        },
        {
          id: "vitamin-c-boost",
          name: "Vitamin C-boost",
          duration: 45,
          price: 1200,
          practitioners: ["christian"],
          description: "En ansiktsbehandling med C-vitamin som ger huden lyster och en jämnare ton.",
          suitable: "Dig med trött eller glanslös hy som vill ge huden ny lyster.",
          es: {
            name: "Tratamiento de vitamina C",
            description: "Un tratamiento facial con vitamina C que aporta luminosidad y un tono más uniforme a la piel.",
            suitable: "Personas con la piel apagada o cansada que desean devolverle la luminosidad.",
          },
        },
      ],
    },
    {
      id: "fotvard",
      name: "Fotvård",
      intro: "Medicinsk fotvård som lindrar, förebygger och ger friska, välmående fötter.",
      es: { name: "Podología", intro: "Podología médica que alivia, previene y mantiene los pies sanos y cuidados." },
      items: [
        {
          id: "fotvard-medicinsk",
          name: "Medicinsk fotvård",
          duration: 45,
          price: 650,
          practitioners: ["lorena"],
          description: "Grundlig fotvård med nagelklippning, nagelbandsvård, borttagning av förhårdnader och avslutande fotkräm. Inkluderar en bedömning av fötternas hälsa.",
          suitable: "Alla som vill ta hand om sina fötter eller har mindre besvär.",
          es: {
            name: "Podología médica",
            description: "Cuidado completo de los pies con corte de uñas, cuidado de cutículas, eliminación de durezas y crema para pies al final. Incluye una evaluación de la salud de tus pies.",
            suitable: "Cualquier persona que quiera cuidar sus pies o tenga molestias leves.",
          },
        },
        {
          id: "fotvard-pensionar",
          name: "Medicinsk fotvård – pensionär",
          duration: 45,
          price: 500,
          practitioners: ["lorena"],
          description: "Samma grundliga medicinska fotvård som den ordinarie behandlingen, till rabatterat pris för pensionärer.",
          suitable: "Dig som är pensionär.",
          es: {
            name: "Podología médica – jubilados",
            description: "La misma podología médica completa que el tratamiento habitual, a precio reducido para jubilados.",
            suitable: "Personas jubiladas.",
          },
        },
        {
          id: "fotvard-friskvard",
          name: "Fotvård – friskvård",
          duration: 45,
          price: 750,
          practitioners: ["lorena"],
          description: "Fotvård med fokus på välbefinnande: nagelvård, borttagning av hård hud och avslutande mjukgörande kräm.",
          suitable: "Dig som vill unna dina fötter en välgörande behandling.",
          es: {
            name: "Podología de bienestar",
            description: "Una podología centrada en el bienestar: cuidado de las uñas, eliminación de durezas y crema hidratante al final.",
            suitable: "Personas que quieren regalar a sus pies un tratamiento reconfortante.",
          },
        },
      ],
    },
  ],
};
