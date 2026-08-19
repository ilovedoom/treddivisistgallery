# Simple art gallery visit 

AGGIUNTA: GAMEPAD STANDARD

Implementa un sistema di controllo tramite gamepad compatibile con i principali controller console.

Il sistema deve riconoscere automaticamente e supportare come standard:

Xbox Controller

Xbox Series X|S Controller

Xbox One Controller

PlayStation DualShock 4

PlayStation DualSense / DualSense Edge

Nintendo Switch Pro Controller

Nintendo Joy-Con, quando esposto dal browser come gamepad compatibile

eventuali gamepad generici compatibili con la Gamepad API

Utilizza la Gamepad API standard del browser e non dipendere da una singola marca o da un singolo identificativo hardware.

Rilevamento automatico

Quando viene collegato un controller:

rileva automaticamente il dispositivo;

identifica, quando possibile, la famiglia del controller;

applica il relativo mapping;

mostra brevemente una notifica:

Controller Xbox collegato

oppure:

Controller PlayStation collegato

oppure:

Controller Nintendo collegato

oppure:

Controller collegato

Se il browser non fornisce informazioni sufficienti per identificare il modello, utilizza il mapping standard Gamepad API.

Non bloccare mai l'esperienza se il controller non viene riconosciuto esattamente.

Mapping standard

Xbox

Utilizza una configurazione intuitiva:

Left Stick
→ movimento

Right Stick
→ visuale

A
→ interagisci / conferma

B
→ indietro / annulla

X
→ interazione alternativa / informazioni opera

Y
→ toggle informazioni / funzione secondaria

LB / RB
→ azioni secondarie

LT
→ interazione / selezione

RT
→ interazione / selezione

Menu / Start
→ menu

View / Back
→ HUD / informazioni


PlayStation

Supporta:

DualShock 4

DualSense

DualSense Edge

Mapping:

Left Stick
→ movimento

Right Stick
→ visuale

Cross / X
→ interagisci / conferma

Circle
→ indietro / annulla

Square
→ interazione alternativa / informazioni

Triangle
→ funzione secondaria

L1 / R1
→ azioni secondarie

L2 / R2
→ interazione / selezione

Options
→ menu

Create
→ HUD / informazioni


L'interfaccia deve utilizzare, quando possibile, le icone PlayStation corrette.

Nintendo

Supporta almeno:

Nintendo Switch Pro Controller

Joy-Con compatibili con Gamepad API

Mapping:

Left Stick
→ movimento

Right Stick
→ visuale

A
→ interagisci / conferma

B
→ indietro / annulla

X
→ informazioni opera

Y
→ funzione secondaria

L / R
→ azioni secondarie

ZL / ZR
→ interazione / selezione

+
→ menu

-
→ HUD / informazioni


Considera la particolare disposizione dei pulsanti Nintendo e non assumere che la posizione fisica dei pulsanti corrisponda a quella Xbox o PlayStation.

Mapping astratto

Per evitare che il resto dell'applicazione debba conoscere il tipo di controller, crea un livello di astrazione:

GamepadInput
      ↓
ControllerMapper
      ↓
Abstract Actions
      ↓
PlayerController


Le azioni astratte devono essere almeno:

MOVE
LOOK
INTERACT
CANCEL
MENU
INFO
ACTION_PRIMARY
ACTION_SECONDARY


In questo modo Xbox, PlayStation e Nintendo possono avere mapping differenti ma produrre gli stessi comandi per il gioco.

Cambio dinamico del controller

Il sistema deve gestire:

collegamento controller;

scollegamento;

sostituzione controller;

collegamento di un secondo controller;

ritorno a mouse/tastiera;

ritorno a touch.

Utilizza gli eventi standard:

gamepadconnected
gamepaddisconnected


Aggiorna automaticamente il sistema di input.

Se il controller viene scollegato durante la visita, l'utente deve poter continuare con mouse/tastiera o touch senza ricaricare la pagina.

UI adattiva

Quando viene rilevato un gamepad, aggiorna automaticamente le istruzioni.

Esempio Xbox:

L Stick  Muovi
R Stick  Guarda
A        Interagisci
B        Indietro
Menu     Menu


PlayStation:

L Stick  Muovi
R Stick  Guarda
✕        Interagisci
○        Indietro
Options  Menu


Nintendo:

L Stick  Muovi
R Stick  Guarda
A        Interagisci
B        Indietro
+        Menu


Le indicazioni devono utilizzare icone e nomenclature coerenti con il controller rilevato.

Non mostrare contemporaneamente istruzioni Xbox, PlayStation e Nintendo.

VR + Gamepad

Il sistema deve consentire la coesistenza tra:

controller VR;

gamepad;

touch;

mouse/tastiera.

La modalità di input deve essere selezionata in base al dispositivo e all'input effettivamente utilizzato.

Per WebXR, i controller VR devono avere priorità durante la sessione VR.

Gamepad e multiplayer

Il metodo di controllo non deve avere alcun impatto sul multiplayer.

Un utente che utilizza:

Xbox


deve poter giocare nella stessa sessione di utenti che utilizzano:

PlayStation
Mobile Touch
Mouse + Keyboard
Nintendo
VR


Tutti devono vedere gli stessi avatar e condividere lo stesso spazio 3D.

Il server/realtime layer non deve avere bisogno di conoscere il tipo di controller utilizzato dal visitatore.

Compatibilità

Dai priorità agli standard web ufficiali:

Gamepad API

Pointer Lock API

WebGL

WebXR

WebSocket/WebRTC o tecnologia realtime appropriata

Non implementare dipendenze proprietarie specifiche Xbox, Sony o Nintendo.

Il riconoscimento deve essere browser-based e cross-platform.

Prevedi fallback per i casi in cui il browser esponga un controller generico o un mapping non standard.

Requisito finale

Il sistema di input completo deve essere:

                 ┌── Mouse + Keyboard
                 │
                 ├── Touch
                 │
                 ├── Xbox
                 │
                 ├── PlayStation
InputManager ────┼── Nintendo
                 │
                 ├── Gamepad generico
                 │
                 └── WebXR Controllers
                          ↓
                   PlayerController
                          ↓
                     Galleria 3D
                          ↓
                    Multiplayer
                       1 - 5


Il visitatore non deve preoccuparsi di configurare manualmente il controller.

Collega il controller, entra nella galleria e il sistema deve riconoscerlo e proporre automaticamente i controlli corretti.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://treddivisistgallery.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c7ed364c-8ab9-467c-a72a-9b660673f221).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
