/*
 * Mederinav Health Care – innehållsdata
 * ------------------------------------------------------------
 * Redigera behandlingar, priser, behandlare och öppettider här.
 * Sidorna Behandlingar, Priser och Boka tid läser allt från denna fil.
 * Alla texter och priser nedan är EXEMPEL/PLATSHÅLLARE – byt ut innan lansering.
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
    { id: "christian", name: "Christian Navarro", role: "Läkare", days: [1, 2, 3, 4, 5] },
    { id: "lorena", name: "Lorena Munoz", role: "Medicinsk fotterapeut & hudterapeut", days: [2, 3, 4, 5, 6] },
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

  // Säsongskampanj – rabatterade behandlingar visas med kampanjpris.
  campaign: {
    name: "Höstkampanj",
    endDate: "2026-11-30",
  },

  categories: [
    {
      id: "medicinskt",
      name: "Medicinska behandlingar",
      intro: "Läkarledda undersökningar och ingrepp för hud och allmän hälsa.",
      items: [
        {
          id: "lakarkonsultation",
          name: "Läkarkonsultation",
          duration: 30,
          price: 900,
          practitioners: ["christian"],
          description: "Ett personligt samtal med läkare där vi går igenom dina besvär, din hälsohistorik och dina önskemål. Du får en tydlig bedömning och en plan för eventuell vidare behandling.",
          suitable: "Dig som vill ha en medicinsk bedömning eller är osäker på vilken behandling som passar.",
        },
        {
          id: "fodelsemarken",
          name: "Födelsemärkeskontroll",
          duration: 30,
          price: 1200,
          practitioners: ["christian"],
          description: "Läkaren undersöker dina födelsemärken med dermatoskop och dokumenterar förändringar. Misstänkta förändringar kan tas bort eller remitteras vidare.",
          suitable: "Dig med många födelsemärken, ljus hud eller ärftlighet för hudcancer.",
        },
        {
          id: "hudforandringar",
          name: "Borttagning av hudförändringar",
          duration: 45,
          price: 1800,
          practitioners: ["christian"],
          description: "Godartade hudförändringar som vårtor, hudflikar och fibrom tas bort under lokalbedövning. Vid behov skickas vävnad för analys.",
          suitable: "Dig som störs av en hudförändring av estetiska eller praktiska skäl.",
        },
        {
          id: "b12",
          name: "B12-injektion",
          duration: 15,
          price: 450,
          practitioners: ["christian"],
          description: "Injektion med vitamin B12 efter läkarbedömning. Kan vara ett komplement vid konstaterad brist och trötthet.",
          suitable: "Dig med konstaterad B12-brist eller som rekommenderats injektioner av läkare.",
        },
      ],
    },
    {
      id: "fillers",
      name: "Fillers",
      intro: "Hyaluronsyra för volym, kontur och återfuktning – med naturligt resultat som mål.",
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
        },
        {
          id: "fillers-kindben",
          name: "Kindben",
          duration: 45,
          price: 4290,
          practitioners: ["christian"],
          description: "Fillers i kindbenen återställer volym som försvunnit med åren och ger ansiktet ett lyft. Resultatet syns direkt och håller upp till 12–18 månader.",
          suitable: "Dig som upplever att ansiktet ser trött eller insjunket ut.",
        },
        {
          id: "fillers-nasolabial",
          name: "Nasolabialveck",
          duration: 45,
          price: 3690,
          practitioners: ["christian"],
          description: "Vecken mellan näsa och mungipor mjukas upp med hyaluronsyra för ett piggare och mer utvilat uttryck.",
          suitable: "Dig med djupa veck från näsvingen ned mot mungiporna.",
        },
        {
          id: "fillers-kaklinje",
          name: "Käklinje & haka",
          duration: 60,
          price: 4990,
          practitioners: ["christian"],
          description: "Skulpterar och definierar käklinjen och hakan för en tydligare profil och bättre balans i ansiktet.",
          suitable: "Dig som vill ha en skarpare käklinje eller mer framträdande haka.",
        },
      ],
    },
    {
      id: "botox",
      name: "Botox",
      intro: "Botulinumtoxin som slätar ut mimikrynkor och kan även behandla svettningar.",
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
        },
        {
          id: "botox-3",
          name: "Botox – tre områden",
          duration: 45,
          price: 4290,
          practitioners: ["christian"],
          description: "Helhetsbehandling av panna, argrynka och kråksparkar under ett och samma besök.",
          suitable: "Dig som vill ha en balanserad föryngring av hela övre ansiktet.",
        },
        {
          id: "botox-svett",
          name: "Svettbehandling",
          duration: 45,
          price: 4990,
          practitioners: ["christian"],
          description: "Botox i armhålorna minskar kraftig svettning (hyperhidros) markant. Effekten håller ofta 6–9 månader.",
          suitable: "Dig som besväras av kraftig svettning trots receptfria antiperspiranter.",
        },
      ],
    },
    {
      id: "fotvard",
      name: "Fotvård",
      intro: "Medicinsk fotvård som lindrar, förebygger och ger friska, välmående fötter.",
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
        },
        {
          id: "fotvard-nageltrang",
          name: "Behandling av nageltrång",
          duration: 45,
          price: 650,
          practitioners: ["lorena"],
          description: "Inåtväxande naglar behandlas skonsamt för att lindra smärta och förebygga inflammation. Vid behov används nagelställning.",
          suitable: "Dig med ömmande, inåtväxande naglar.",
        },
        {
          id: "fotvard-liktornar",
          name: "Liktornar & förhårdnader",
          duration: 30,
          price: 450,
          practitioners: ["lorena"],
          description: "Liktornar och tjock hud avlägsnas varsamt. Du får råd om avlastning och skor för att förhindra att besvären kommer tillbaka.",
          suitable: "Dig med tryckömhet eller hård hud under foten.",
        },
        {
          id: "fotvard-diabetes",
          name: "Fotvård vid diabetes",
          duration: 60,
          price: 750,
          practitioners: ["lorena"],
          description: "Anpassad fotvård med extra fokus på att förebygga sår och infektioner, inklusive kontroll av känsel och cirkulation.",
          suitable: "Dig med diabetes eller nedsatt cirkulation i fötterna.",
        },
      ],
    },
  ],
};
