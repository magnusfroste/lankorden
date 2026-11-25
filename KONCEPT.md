# Länkorden – koncept och testplan

**Mål (en sak):** barnet ska välja det bindeord som gör att två engelska satser hänger ihop
och blir sanna. Inget annat.

**Målgrupp:** engelska åk 7–9 (12–15 år). Text är tillåten i den åldern – frågan, satserna och
förklaringen står skrivna på skärmen och läses dessutom upp.

**KärnmekanIK (touch först):** två satser med en lucka emellan ("We missed the start of the film
___ we arrived late."). Under dem fyra ord som stora knappar. Ett tryck = ett svar. Rätt svar
fyller luckan med ordet, skriver förklaringen på svenska och går vidare efter 1,75 s. Fel svar
kostar ingenting: en ledtråd skrivs ut och barnet trycker igen; stjärnan uteblir bara om första
försöket var fel.

**Nivåer (1 mekanik, tre svårighetsgrader):**
1. orsak och följd – because, since, so, therefore
2. motsats – but, however, although
3. tid och tillägg – while, meanwhile, afterwards, moreover, also, when
Tio uppgifter per nivå, ordningen slumpas, alltid fyra alternativ.

**5-minuterssession:** en nivå är 10 uppgifter ≈ 4–5 minuter, sedan nivåklar-skärm med stjärnor,
"av N rätt" och knapp till nästa nivå.

**Belöning barnet kan berätta om:** "Jag fick 9 stjärnor och klarade alla tre nivåerna."

**Vad barnet lär:** bindeordens betydelse i sammanhang – att avgöra vilken relation två satser har
(orsak, följd, motsats, tid, tillägg) innan man väljer ord. Det är exakt det kunskapskravet pekar på.

**Lgr22:** EN.7-9.2.8 – "Hur sammanbindande ord och andra uttryck används för att skapa struktur
och språkligt sammanhängande helheter." (Skolverket, Syllabus API, hämtad 2026-11-23, citerat ordagrant.)

**Varför det funkar på iPad:** fyra stora tryckytor (69–84 px höga), inget att dra, ingen tid som
pressar, allt ryms utan scroll i både liggande och stående, ljudet går att stänga av och allt som
sägs står också skrivet.

## Testplan (mätbara krav)

| Krav | Mätning | Resultat |
|---|---|---|
| Spelbart med bara fingrar | tryck på Spela + tio svar i rad | ja (pekar-/touch-händelse; se not) |
| Allt ryms på skärmen | `scrollHeight-innerHeight` / `scrollWidth-innerWidth` i 1024×768, 768×1024, 390×844, 1440×900 | 0 / 0 i alla fyra |
| Tryckyta | minsta knapphöjd | 69 px (krav ≥ 44 px för 12–15) |
| Svensk text i barnets nivå | genomläsning av alla 30 förklaringar | ja, "du"-form |
| Återkoppling + nytt försök | fel svar → ledtråd, knappen felmarkeras 0,9 s, inget straff | ja |
| Ingen inloggning/reklam/länkar ut | `check_app` + genomläsning | ja |
| Korrekt fakta | `node verify.cjs` mot oberoende regelbok: 30 uppgifter, 20 000 rundor, 200 000 tryckta svar, 0 brott | 0 fel |
| Ljud | 30 engelska satspar (en-US-Aria) + 30 förklaringar + ledtråd + nivåklara (sv-SE-Sofie) som mp3, talsyntes bara reserv | se ljudrapport |

**Not om touch:** den här körningens CDP-session svarade timeout på `Input.dispatchTouchEvent`
(även efter omförsök), så hela nivå 1 spelades med koordinattryck (`Input.dispatchMouseEvent`),
vilket träffar samma `click`-hanterare som en touch gör. Touch-emuleringen var påslagen men
händelsesändningen föll på demon, inte på appen. En riktig iPad-verifiering återstår.

## Validering med annan agent

`delegate_task` finns inte i den här cron-sessionens verktygslåda; valideringen gjordes i stället
som en egen kritisk genomgång: (a) frivilligt 5 minuter – ja, en fråga tar ~8 s och nivån har ett
tydligt slut; (b) verkligt kunskapskrav – ja, EN.7-9.2.8 ordagrant ur Syllabus API; (c) teknisk
risk – låg, statisk sida utan beroenden utöver kotten.js, data verifierad i `verify.cjs`.