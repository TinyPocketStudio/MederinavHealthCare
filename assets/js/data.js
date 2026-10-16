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
    email: "mederinav@gmail.com",
    address: "Sjödalsvägen 18, 141 47 Huddinge",
  },

  // Behandlare. `days` = veckodagar de arbetar (1 = måndag … 6 = lördag, 0 = söndag).
  team: [
    { id: "christian", name: "Christian Navarro", role: "Läkare", es: { role: "Médico" }, days: [1, 2, 3, 4, 5] },
    { id: "lorena", name: "Lorena Munoz", role: "Medicinsk fotterapeut & hudterapeut", es: { role: "Podóloga clínica y terapeuta de la piel" }, days: [2, 3, 4, 5, 6] },
  ],

  // Öppettider per veckodag: [öppnar, stänger] eller null = stängt.
  hours: {
    1: ["09:00", "17:00"],
    2: ["09:00", "17:00"],
    3: ["09:00", "19:00"],
    4: ["09:00", "17:00"],
    5: ["09:00", "16:00"],
    6: ["10:00", "14:00"],
    0: null,
  },
  slotMinutes: 30,       // Intervall mellan bokningsbara starttider
  bookingWeeksAhead: 8,  // Hur många veckor framåt man kan boka
  minNoticeHours: 2,     // Minsta framförhållning för en bokning

  // Bokningssystemet (mappen booking-api/). När sidan öppnas lokalt (localhost)
  // används automatiskt testservern på http://localhost:8787 i stället.
  // OBS: bokningssystemet läser också den här filen – ändringar här gäller båda.
  booking: { apiBase: "https://api.mederinavhealthcare.se" },

  // Säsongskampanj – rabatterade behandlingar visas med kampanjpris.
  campaign: {
    name: "Höstkampanj",
    es: { name: "Campaña de otoño" },
    endDate: "2026-11-30",
  },

  categories: [
    {
      id: "medicinskt",
      name: "Medicinska behandlingar",
      intro: "Läkarledda undersökningar och ingrepp för hud och allmän hälsa.",
      es: { name: "Tratamientos médicos", intro: "Exámenes y procedimientos dirigidos por médicos para la piel y la salud general." },
      items: [
        {
          id: "lakarkonsultation",
          name: "Läkarkonsultation",
          duration: 30,
          price: 900,
          practitioners: ["christian"],
          description: "Ett personligt samtal med läkare där vi går igenom dina besvär, din hälsohistorik och dina önskemål. Du får en tydlig bedömning och en plan för eventuell vidare behandling.",
          suitable: "Dig som vill ha en medicinsk bedömning eller är osäker på vilken behandling som passar.",
          es: {
            name: "Consulta médica",
            description: "Una conversación personal con el médico en la que revisamos tus molestias, tu historial de salud y tus deseos. Recibirás una evaluación clara y un plan para un posible tratamiento posterior.",
            suitable: "Personas que desean una evaluación médica o no saben qué tratamiento les conviene.",
          },
        },
        {
          id: "fodelsemarken",
          name: "Födelsemärkeskontroll",
          duration: 30,
          price: 1200,
          practitioners: ["christian"],
          description: "Läkaren undersöker dina födelsemärken med dermatoskop och dokumenterar förändringar. Misstänkta förändringar kan tas bort eller remitteras vidare.",
          suitable: "Dig med många födelsemärken, ljus hud eller ärftlighet för hudcancer.",
          es: {
            name: "Control de lunares",
            description: "El médico examina tus lunares con un dermatoscopio y documenta los cambios. Las lesiones sospechosas pueden extirparse o derivarse a un especialista.",
            suitable: "Personas con muchos lunares, piel clara o antecedentes familiares de cáncer de piel.",
          },
        },
        {
          id: "hudforandringar",
          name: "Borttagning av hudförändringar",
          duration: 45,
          price: 1800,
          practitioners: ["christian"],
          description: "Godartade hudförändringar som vårtor, hudflikar och fibrom tas bort under lokalbedövning. Vid behov skickas vävnad för analys.",
          suitable: "Dig som störs av en hudförändring av estetiska eller praktiska skäl.",
          es: {
            name: "Eliminación de lesiones cutáneas",
            description: "Las lesiones cutáneas benignas, como verrugas, acrocordones y fibromas, se eliminan con anestesia local. Si es necesario, el tejido se envía a analizar.",
            suitable: "Personas a quienes les molesta una lesión cutánea por motivos estéticos o prácticos.",
          },
        },
        {
          id: "b12",
          name: "B12-injektion",
          duration: 15,
          price: 450,
          practitioners: ["christian"],
          description: "Injektion med vitamin B12 efter läkarbedömning. Kan vara ett komplement vid konstaterad brist och trötthet.",
          suitable: "Dig med konstaterad B12-brist eller som rekommenderats injektioner av läkare.",
          es: {
            name: "Inyección de vitamina B12",
            description: "Inyección de vitamina B12 tras una evaluación médica. Puede ser un complemento en caso de déficit confirmado y cansancio.",
            suitable: "Personas con déficit de B12 confirmado o a quienes un médico les ha recomendado inyecciones.",
          },
        },
      ],
    },
    {
      id: "fillers",
      name: "Fillers",
      intro: "Hyaluronsyra för volym, kontur och återfuktning – med naturligt resultat som mål.",
      es: { name: "Rellenos dérmicos", intro: "Ácido hialurónico para dar volumen, contorno e hidratación, con un resultado natural como objetivo." },
      items: [
        {
          id: "fillers-lappar",
          name: "Läppförstoring",
          duration: 45,
          price: 3690,
          campaignPrice: 2990,
          practitioners: ["christian"],
          description: "Hyaluronsyra ger läpparna mer volym, tydligare kontur eller jämnare symmetri. Vi arbetar varsamt för ett mjukt och naturligt resultat som håller cirka 6–12 månader.",
          suitable: "Dig som vill ha fylligare, mer definierade eller mer symmetriska läppar.",
          es: {
            name: "Aumento de labios",
            description: "El ácido hialurónico aporta a los labios más volumen, un contorno más definido o una simetría más uniforme. Trabajamos con delicadeza para lograr un resultado suave y natural que dura aproximadamente 6–12 meses.",
            suitable: "Personas que desean unos labios más carnosos, definidos o simétricos.",
          },
        },
        {
          id: "fillers-kindben",
          name: "Kindben",
          duration: 45,
          price: 4290,
          practitioners: ["christian"],
          description: "Fillers i kindbenen återställer volym som försvunnit med åren och ger ansiktet ett lyft. Resultatet syns direkt och håller upp till 12–18 månader.",
          suitable: "Dig som upplever att ansiktet ser trött eller insjunket ut.",
          es: {
            name: "Pómulos",
            description: "El relleno en los pómulos restaura el volumen perdido con los años y aporta un efecto lifting al rostro. El resultado se ve de inmediato y dura hasta 12–18 meses.",
            suitable: "Personas que sienten que su rostro se ve cansado o hundido.",
          },
        },
        {
          id: "fillers-nasolabial",
          name: "Nasolabialveck",
          duration: 45,
          price: 3690,
          practitioners: ["christian"],
          description: "Vecken mellan näsa och mungipor mjukas upp med hyaluronsyra för ett piggare och mer utvilat uttryck.",
          suitable: "Dig med djupa veck från näsvingen ned mot mungiporna.",
          es: {
            name: "Surcos nasolabiales",
            description: "Los surcos entre la nariz y las comisuras de la boca se suavizan con ácido hialurónico para una expresión más fresca y descansada.",
            suitable: "Personas con surcos profundos desde las aletas de la nariz hasta las comisuras de la boca.",
          },
        },
        {
          id: "fillers-kaklinje",
          name: "Käklinje & haka",
          duration: 60,
          price: 4990,
          practitioners: ["christian"],
          description: "Skulpterar och definierar käklinjen och hakan för en tydligare profil och bättre balans i ansiktet.",
          suitable: "Dig som vill ha en skarpare käklinje eller mer framträdande haka.",
          es: {
            name: "Mandíbula y mentón",
            description: "Esculpe y define la línea de la mandíbula y el mentón para un perfil más marcado y un rostro más equilibrado.",
            suitable: "Personas que desean una mandíbula más definida o un mentón más prominente.",
          },
        },
      ],
    },
    {
      id: "botox",
      name: "Botox",
      intro: "Botulinumtoxin som slätar ut mimikrynkor och kan även behandla svettningar.",
      es: { name: "Botox", intro: "Toxina botulínica que suaviza las arrugas de expresión y también puede tratar la sudoración excesiva." },
      items: [
        {
          id: "botox-1",
          name: "Botox – ett område",
          duration: 30,
          price: 2490,
          campaignPrice: 1990,
          practitioners: ["christian"],
          description: "Behandling av ett område, till exempel panna, argrynka eller kråksparkar. Effekten kommer efter 3–14 dagar och håller i regel 3–4 månader.",
          suitable: "Dig som vill förebygga eller mjuka upp rynkor i ett avgränsat område.",
          es: {
            name: "Botox – una zona",
            description: "Tratamiento de una zona, por ejemplo la frente, el entrecejo o las patas de gallo. El efecto aparece a los 3–14 días y suele durar 3–4 meses.",
            suitable: "Personas que desean prevenir o suavizar las arrugas de una zona concreta.",
          },
        },
        {
          id: "botox-2",
          name: "Botox – två områden",
          duration: 30,
          price: 3490,
          campaignPrice: 2790,
          practitioners: ["christian"],
          description: "Kombinera två områden, exempelvis panna och argrynka, för ett harmoniskt och fräscht resultat.",
          suitable: "Dig som vill behandla flera närliggande mimikrynkor samtidigt.",
          es: {
            name: "Botox – dos zonas",
            description: "Combina dos zonas, por ejemplo la frente y el entrecejo, para un resultado armonioso y fresco.",
            suitable: "Personas que desean tratar a la vez varias arrugas de expresión cercanas.",
          },
        },
        {
          id: "botox-3",
          name: "Botox – tre områden",
          duration: 45,
          price: 4290,
          practitioners: ["christian"],
          description: "Helhetsbehandling av panna, argrynka och kråksparkar under ett och samma besök.",
          suitable: "Dig som vill ha en balanserad föryngring av hela övre ansiktet.",
          es: {
            name: "Botox – tres zonas",
            description: "Tratamiento completo de frente, entrecejo y patas de gallo en una misma visita.",
            suitable: "Personas que desean un rejuvenecimiento equilibrado de todo el tercio superior del rostro.",
          },
        },
        {
          id: "botox-svett",
          name: "Svettbehandling",
          duration: 45,
          price: 4990,
          practitioners: ["christian"],
          description: "Botox i armhålorna minskar kraftig svettning (hyperhidros) markant. Effekten håller ofta 6–9 månader.",
          suitable: "Dig som besväras av kraftig svettning trots receptfria antiperspiranter.",
          es: {
            name: "Tratamiento de la sudoración",
            description: "El botox en las axilas reduce notablemente la sudoración excesiva (hiperhidrosis). El efecto suele durar 6–9 meses.",
            suitable: "Personas con sudoración intensa a pesar de usar antitranspirantes de venta libre.",
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
          duration: 60,
          price: 750,
          campaignPrice: 640,
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
          id: "fotvard-nageltrang",
          name: "Behandling av nageltrång",
          duration: 45,
          price: 650,
          practitioners: ["lorena"],
          description: "Inåtväxande naglar behandlas skonsamt för att lindra smärta och förebygga inflammation. Vid behov används nagelställning.",
          suitable: "Dig med ömmande, inåtväxande naglar.",
          es: {
            name: "Tratamiento de uña encarnada",
            description: "Las uñas encarnadas se tratan con cuidado para aliviar el dolor y prevenir la inflamación. Si es necesario, se coloca una ortesis ungueal.",
            suitable: "Personas con uñas encarnadas y dolorosas.",
          },
        },
        {
          id: "fotvard-liktornar",
          name: "Liktornar & förhårdnader",
          duration: 30,
          price: 450,
          practitioners: ["lorena"],
          description: "Liktornar och tjock hud avlägsnas varsamt. Du får råd om avlastning och skor för att förhindra att besvären kommer tillbaka.",
          suitable: "Dig med tryckömhet eller hård hud under foten.",
          es: {
            name: "Callos y durezas",
            description: "Los callos y la piel engrosada se eliminan con cuidado. Recibirás consejos sobre descarga y calzado para evitar que las molestias vuelvan.",
            suitable: "Personas con dolor por presión o piel dura en la planta del pie.",
          },
        },
        {
          id: "fotvard-diabetes",
          name: "Fotvård vid diabetes",
          duration: 60,
          price: 750,
          practitioners: ["lorena"],
          description: "Anpassad fotvård med extra fokus på att förebygga sår och infektioner, inklusive kontroll av känsel och cirkulation.",
          suitable: "Dig med diabetes eller nedsatt cirkulation i fötterna.",
          es: {
            name: "Podología para personas con diabetes",
            description: "Cuidado de los pies adaptado, con especial atención a la prevención de úlceras e infecciones, que incluye un control de la sensibilidad y la circulación.",
            suitable: "Personas con diabetes o mala circulación en los pies.",
          },
        },
      ],
    },
  ],
};
