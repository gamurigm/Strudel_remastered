//SESION EN VIVO #1
/*
setDefaultVoicings('legacy')

melody: "<~@4 0@16 1@7 2@11.5 ~@3.5>".pickRestart([
  `<4 [2@2 1] [0@4 0 1]@2 [2 0 2] [4@2 5] 4 3 
    3 [1@2 0] [0b@4 -3 0b]@2 [1 0b 1] [3 4 [5,3]] 4b 4>`,
    "<[9,7] [[4,8,6]@2 [7,5]] [[6,4]@2 [5,3]] [3,0,9] [8,6,3] [[7,5,4]@2 [6,4]] [8,4]>", 
  "<[~ [2,4 ~] [3,5 ~]] [[4,6 ~] [4 3] [4 5]] [[3,6,9 ~] [3 2] [3 4]] [[2,6 ~] ~ [2,4,6,8 ~]] > ".sub("<0 0 [0,2]>/4") ])
      .scale("c5:minor").note().s("gm_oboe:3").gain(0.8)._pianoroll({minMidi:10})


piano: "<0@28 1@10 0@4>".pickRestart([
     n("<<0 -1> [9,4,5,7,13]!2>*3").chord("<Cm@10 Fm@4 G@4 Cm@4 Fm@2 Bb@2 Eb Ab>"),
     n("<3 <[4,5,9,13] > ~>*3").chord("<G Ab Cm Ab>")
          ]).anchor('f2').mode('root').voicing().piano()._pianoroll()



tempochanges: cps(sine.segment(32).slow(16).mul(30).add(160).div(60*3)).gain(0)

all(x=>x
  //.ribbon(24,16)
  .room(1.1))
 */






//*********************************************************
// SESSION #2 

/*
  // Instrumentos
const i_sax   = x => x.s("sax").gain(1)
const i_drums = x => x.bank("YamahaRY30").gain(0.1)

// Mel & Rythm
const saxMelody1 = n(" -9 -11 -13 <-7@4 ~ <~ -5 ~ <2 5 -8>-4@2>>").clip(0.8)
const saxMelody2 = n(" -7 -13 -15 <-19@4 ~ <~ -5 ~ <0 ~ -3 -7>>>").clip(0.8)
const saxMelody3 = n("-7@4 -7@8 ~@8<-5@4 -7>").clip(0.7)

const saxMelody5 = n("~ <-3 ~ ~ ~ ~@8 <2@4 -15> -4 -15>").clip(0.7)
const drumBeat = "bd sd*2 bd*3 <bd ~ hh>, hh*2"

// Mezclamos sax + batería
const part = stack(
  saxMelody5.scale("b:major").apply(i_sax), s(drumBeat).apply(i_drums),

  saxMelody3.scale("b:major").apply(i_sax), s(drumBeat).apply(i_drums),
  saxMelody2.scale("b:major").apply(i_sax), s(drumBeat).apply(i_drums),
  saxMelody1.scale("f#:major").apply(i_sax),s(drumBeat).apply(i_drums)
)

arrange([4, part]).cpm(42).pianoroll({fold:0})

*/

//*********************************************************
// SESSION #3
/*
setcps(135 / 60 / 4)

bass: "<0@3 1 0 1@2 0@2 0*4 [2@25 3@7]@2 0 [0 ~@31]>/8".pickRestart([
  n("<7!3 [4 6] 7*2 7!2 6 9!3 [6 9] 11*2 11!2 10>*4"),
  n("<[9*2 9!2 [6 7]]!2 [11*2 11!2 [6 7]] [11 12# 13 14] >"),
  n("<[~ 9 12!2]!2 [~ 9 10!2] [~ 7 10!2] [7!2 14!2] [~ 7 11!2]!2>*2"),
  n("<[~ 6 13!2]!3>*2")
]).scale('bb1:minor').s('sawtooth').clip(.95).lpf(300).lpe(1).gain(1).room(.3)._pianoroll({minMidi:10})

gneeow: "<0 ~@3 0 ~@4 ~ ~@2 0 1>/8".pickRestart([
  n("<~ [4,7,9]@3 ~@4>*2"),n("<[4,7,9]@2 ~@6>")
]).scale('bb4:minor').s('sawtooth').vib(4.5).vibmod(.4).gain(1).room(.8)._pianoroll({minMidi:10})


dindin: "<~ 0@2 ~@4 0@2 ~@5>/8".pickRestart([
  n("[1 2]*4").pan("[.45 .55]*4")
]).scale('bb6:minor').s('square').att(0).dec(.5).rel(.3).gain(.15)._pianoroll({minMidi:10})



pads: "<5 ~@2 0 1 0@2 ~@2 2 [3@25 4@7]@2 ~@2>/8".pickRestart([
  n("<[2,4,6] [-3,-1,1]>/2").lpf(1500).att(.4).rel(.5).gain(.7),
  n("<~@4 11 [9 10] 8 -1 [0@3 ~]@2 ~@2 11 [9 10] 8 13 >*2").lpf(1500).att(.4).rel(.5).gain(1.2),
  n("<[-3,0,2] [-3,-1,1]>/2").lpf(1500).gain(.5),
  n("<[5,7,9]@2 [5,7,10]@2 [[4,7,9] [4,7,8] [4,6]]@3>*2").gain(1),
  n("<[6,8,10]@3 ~@4>*2").gain(1),
  n("<0>").gain(0) // preload
]).scale('bb4:minor').s('gm_pad_warm').room(.4)._pianoroll({minMidi:10})



voice: "<~ 0 1 2 ~ 2 2*2 0 1 ~ [3@27 ~@5]@2 ~@2>/8".pickRestart([
  n("<~@3 [2 2@3]@2 3 4 [5 6@3]@2 7 [8 6] [~ 4@3]@2 ~@9 [4 3@3]@2 4 3 4 [5 6@3]@2 [7 8@3]@2 ~>*4").gain(.4),
  n("<~@5 4 [4 ~] [3 ~] [4 6@2 4@5]@4 ~@7 [2 2@3]@2 3 4 [5 6@3]@2 ~@4 >*4").gain(.4),
  n("<~@4 6 7 8 [6 4@3]@2 ~@10 4 [6 7@2 8@2 6@2 4@3]@5 ~@7>*4").gain(.5),
  n("<9 ~ 7 ~ 11 8 ~ ~ [9 10 9] 7 ~ 11 8 ~>*2").gain(.8).delay(.4).dt(.3).dfb(.75)
]).scale('bb3:minor').s('pulse').clip(.9).layer(x=>x.pan(.2),x=>x.late(.02).pan(.8)).room(1.2)._pianoroll({minMidi:10})

drums: "<[0,1,2] 2@2 [0,2] [0,1,2] [0,2]@2 2@2 [2,[~ 1*2]] 2@2 [0,1,2] ~>/8".pickRestart([
  "<[~ <~@3 bd ~@4>]>*4",  "<~ <cp ~> ~@6>*4",  "<bd sd>*4"
]).pickOut({
  bd:s('linndrum_bd').lpf(3000).room(.2).gain(.8),
  sd:s('linndrum_sd').room(.2).gain(.65),
  cp:s('cp').velocity(2).room(1)
})._pianoroll({fold:1})

all(x=>x
   //.ribbon(16,1*4)
   )

  


setcps(135 / 60 / 4)

bass: "<0@3 1 0 1@2 0@2 0*4 [2@25 3@7]@2 0 [0 ~@31]>/8".pickRestart([
  n("<7!3 [4 6] 7*2 7!2 6 9!3 [6 9] 11*2 11!2 10>*4"),
  n("<[9*2 9!2 [6 7]]!2 [11*2 11!2 [6 7]] [11 12# 13 14] >"),
  n("<[~ 9 12!2]!2 [~ 9 10!2] [~ 7 10!2] [7!2 14!2] [~ 7 11!2]!2>*2"),
  n("<[~ 6 13!2]!3>*2")
]).scale('e1:minor').s('sawtooth').clip(.95).lpf(300).lpe(1).gain(1.5).room(.3)._pianoroll({minMidi:10})


pads: "<5 ~@2 0 1 0@2 ~@2 2 [3@25 4@7]@2 ~@2>/8".pickRestart([
  n("<[-9,2,4,6] [-3,-1,1]>/2").lpf(1500).att(.8).rel(.5).gain(.7),
  n("<~@4 11 [9 10] 8 -1 [0@3 ~]@2 ~@2 11 [9 10] 8 13 >*2").lpf(1500).att(.4).rel(.5).gain(1.2),
  n("<[-3,0,2] [-3,-1,1]>/2").lpf(1500).gain(.5),
  n("<[5,7,9]@2 [5,7,10]@2 [[4,7,9] [4,7,8] [4,6,8]]@3>*2").gain(1),
  n("<[6,8,10,11]@3 ~@4>*2").gain(1),
  n("<0>").gain(0)
]).scale('e4:minor').s('gm_rock_organ').gain(3).room(.6)._pianoroll({minMidi:10})

drums: "<[0,1,2] 2@2 [0,2] [0,1,2] [0,2]@2 2@2 [2,[~ 1*2]] 2@2 [0,1,2] ~>/8".pickRestart([
  "<[~ <~@3 bd ~@4>]>*4",  "<~ <cp ~> ~@6>*4",  "<bd sd>*4"
]).pickOut({
  bd:s('linndrum_bd').lpf(4000).room(.2).gain(1.5),
  sd:s('linndrum_sd').room(.5).gain(.65),
  cp:s('cp').velocity(2).room(1.5)
})._pianoroll({fold:1})

*/

/******************************************************/
 //SESSION #4

/*
setcps(135 / 60 / 4)

bass: "<0@3 1 0 1@2 0@2 0*4 [2@25 3@7]@2 0 [0 ~@31]>/8".pickRestart([
  n("<7!3 [4 6] 7*2 7!2 6 9!3 [6 9] 11*2 11!2 10>*4"),
  n("<[9*2 9!2 [6 7]]!2 [11*2 11!2 [6 7]] [11 12# 13 14] >"),
  n("<[~ 9 12!2]!2 [~ 9 10!2] [~ 7 10!2] [7!2 14!2] [~ 7 11!2]!2>*2"),
  n("<[~ 6 13!2]!3>*2")
]).scale('gb1:minor').s('sawtooth').clip(.95).lpf(300).lpe(1).gain(1.5).room(.3)._pianoroll({minMidi:10})


pads: "<5 ~@2 0 1 0@2 ~@2 2 [3@25 4@7]@2 ~@2>/8".pickRestart([
  n("<[-9,2,4,6] [-3,-1,1]>/2").lpf(1500).att(.8).rel(.5).gain(.7),
  n("<~@4 11 [9 10] 8 -1 [0@3 ~]@2 ~@2 11 [9 10] 8 13 >*2").lpf(1500).att(.4).rel(.5).gain(1.2),
  n("<[-3,0,2] [-3,-1,1]>/2").lpf(1500).gain(.5),
  n("<[5,7,9]@2 [5,7,10]@2 [[4,7,9] [4,7,8] [4,6,8]]@3>*2").gain(1),
  n("<[6,8,10,11]@3 ~@4>*2").gain(1),
  n("<0>").gain(0)
]).scale('gb4:minor').s('gm_rock_organ').gain(3).room(.6)._pianoroll({minMidi:10})

drums: "<[0,1,2] 2@2 [0,2] [0,1,2] [0,2]@2 2@2 [2,[~ 1*2]] 2@2 [0,1,2] ~>/8".pickRestart([
  "<[~ <~@3 bd ~@4>]>*4",  "<~ <cp ~> ~@6>*4",  "<bd sd>*4"
]).pickOut({
  bd:s('linndrum_bd').lpf(4000).room(.2).gain(1.5),
  sd:s('linndrum_sd').room(.5).gain(.65),
  cp:s('cp').velocity(2).room(1.5)
})._pianoroll({fold:1})
*/

/////////////////////
// SESSION #5 tomato 

/*
const keys = x => x.s('sawtooth').cutoff(1200).gain(.5)
  .attack(0).decay(.16).sustain(.3).release(.25);

const drums = stack(
  s("bd*2").mask("<x@7 ~>/8").gain(.8),
  s("~ <sd!7 [sd@3 ~]>").mask("<x@7 ~>/4").gain(.5),
  s("[~ hh]*2").delay(.3).delayfeedback(.5).delaytime(.125).gain(.4)
);

const synths = stack(
  
  "<eb4 d4 c4 b3>/2"
  .scale("<C:minor!3 C:melodic:minor>/2")
  .struct("[~ x]*2")
  .layer(
    x=>x.scaleTranspose(0).early(0),
    x=>x.scaleTranspose(2).early(1/8),
    x=>x.scaleTranspose(7).early(1/4),
    x=>x.scaleTranspose(8).early(3/8)
  ).note().apply(keys).mask("<~ x>/16")
  .color('darkseagreen'),
  
  note("<C2 Bb1 Ab1 [G1 [G2 G1]]>/2")
  .struct("[x [~ x] <[~ [~ x]]!3 [x x]>@2]/2".fast(2))
  .s('sawtooth').attack(0.01).decay(0.2).sustain(1).cutoff(500)
  .color('brown'),
  chord("<Cm7 Bb7 Fm7 [G7#9 G7b9 G7b13]>/2")
  .struct("~ [x@0.2 ~]".fast(2))
  .dict('lefthand').voicing()
  .every(2, early(1/8))
  .apply(keys).sustain(0)
  .delay(.4).delaytime(.12)
  .mask("<x@7 ~>/8".early(1/4))
).add(note("<-1 0>/8"))
stack(
  drums.fast(2).color('tomato'), 
  synths
).slow(2)
  .pianoroll({})
  
*/

 ////////////////////////////////
 //SESSION 6 
 
// Probar un sample remoto de github
/*
await samples({
    'aaahh': 'aaahh.mp3'
  }, 'https://raw.githubusercontent.com/gamurigm/samples/main/')

setcps(120/60/4)
test_aaahh: n("<0 1 2>").s("aaahh").gain(0.9)
*/

//---------------------------------------------------------------------------
/*
await samples({
  'kick': 'kicks/808-kick-attic-d.mp3',
  'hih':   'hihat/closed-hi-hat_B_minor.wav'
}, 'http://172.18.224.1:5432/')
//lo usamos solo si estamos en session web, para desktop usamos la notacion local, es decir el nombre de la subcarpeta específca en samples/ usando n() para escojer el sample que queremos de 0 a n
*/



//*************************************************************************************************** */
//SESSION #7
/*
setCps(120/60/4)

const accordi = x => x.note().s("gm_piano:13").gain(0.5).clip(1).release(0.5)  //1 10
const melodia = x => x.note().s("gm_tenor_sax:1").gain(2).clip(1).release(0.1)._scope()
const scala   = cat('d minor')


harmony: stack(   
  //|Gm7       |Bbmaj7    |Dm7       |Fmaj7 
"<[2,3,5,13] [0,4,5,12] [-1,0,2,9] [1,2,4,11]>".scale(scala).apply(accordi),
  "<[2@3 <-4 2>] [-1@3 [~ 4]] [<0 1 [[~ -1 -2 -3]]*2>]>"
    .scale(scala).transpose(12).apply(melodia)
).gain(2)._pianoroll({labels:1,strikeActive:1}) 


drumsStack: stack(
  n("[6 ~ ~ ~] [4 ~ ~ ~] [4 ~ ~ ~] [6 6 ~ ~ ~]").s("kicks").gain(0.9),
  n("<~ 1 ~ 1 ~ 1 ~ 1>*8").s("hihat").gain(0.25)
).gain(2.5)._pianoroll({fill:1,strikeActive:1})
*/

//
//SESSION 8
/*

setCps(100/80/4)



      //cada [xxxx]  en este ej  es un negra 
drumsStack: stack(
  n("[6 ~ ~ ~] [4 ~ ~ ~] [4 ~ ~ ~] [6 6 ~ ~ ~]").s("kicks").gain(-1).lpf(4500),
  //n("[~ ~ ~ ~] [0 ~ ~ ~] [~ ~ ~ ~] [0 ~ ~ ~]").s("clap").gain(0.9).clip(0.85).hpf(1000)      // elimina graves molestos
       
   // .room(0.1),

      // .|
    n("<[~@6 0 0] [0 0 ~ 0] [~ 0 0 ~] [~ ~ 0 0 ~ 0! ~] [0 ~ ~ 0 ~ 0 0 ~]/4 [0 ~ 0 0]>*2").s("clap").gain(1.25).clip(0.65).hpf(1000)      // elimina graves molestos
         
    .room(0.1),
  //("<~ 1 ~ 1 ~ 1 ~ 1>*8").s("hihat").gain(1),
  n("< ~ 0 5 ~ 0 ~ 0 1 ~ 1 1 ~   ~ ~  ~ 1 ~ 0 ~~ ~1>*16").s("hihat").gain(5).room(.5)
).gain(0.9)._pianoroll({fill:1,strikeActive:1})

*/ 


/*
// SESSION 9 

setcpm(125/4);

//Diccionario de voicings

setDefaultVoicings('legacy');

// --- PRESETS DE SÍNTESIS ---
// Un preset para pads suaves y atmosféricos.
const padKeys = p => p.s('triangle').cutoff(1800).gain(0.6)
  .attack(0.2).decay(0.4).sustain(0.5).release(0.8)
  .room(0.4).delay(0.5).dfb(0.4).dt(3/8);

// Un preset para leads/arpegios, más brillante y percusivo.
const leadKeys = p => p.s('sawtooth').cutoff(2500).gain(0.4)
  .attack(0.01).decay(0.15).sustain(0.2).release(0.25)
  .lpf(4000).lpr(0.2); // Filtro con resonancia para carácter.

// Un preset para el bajo, profundo y con pegada.
const bassSynth = p => p.s('sub').cutoff(600).gain(0.9)
  .attack(0.01).decay(0.2).sustain(0.1).release(0.2)
  .clip(0.9); // Ligera saturación para más cuerpo.

// --- SECCIONES MUSICALES ---

// 1. BATERÍA (DRUMS)

const drums = stack(
  // Bombo four-on-the-floor con una máscara para crear síncopa en el último pulso.
  s("bd*4").mask("x*3 [x ~ x ~]").gain(0.9),
  
  // Caja en los pulsos 2 y 4, con un golpe fantasma.
  s("~ sd ~ [sd sd]").velocity("<0.9 0.5>").gain(0.8),
  
  // Hi-hats cerrados con un patrón de ganancia para humanizar el ritmo.
  s("hh*8").patt("0.8 0.6 1 0.7").gain(0.5),

  // Hi-hat abierto en el off-beat.
  s("~ oh").every(2, rev).gain(0.6)
).color('coral');


// 2. ARMONÍA (HARMONY)

const harmony = chord("<Am G C F>/2")
  .anchor("<c4 g3 e4 d4>/4") // Ancla móvil para guiar las inversiones.
  .voicing()
  .apply(padKeys) // Aplica el preset de pad.
  .color('skyblue');


// 3. MELODÍA (MELODY)

const melody = n("0 2 3 5 7 5 3 2")
  .scale("a:minor") // Fija la escala a La menor.
  .layer(
    // Capa 1: Melodía principal.
    x => x.scaleTranspose(0).early(0),
    // Capa 2: Una tercera arriba, ligeramente adelantada.
    x => x.scaleTranspose(2).early(1/16).gain(0.7),
    // Capa 3: Una octava arriba, para dar brillo.
    x => x.transpose(12).early(1/8).gain(0.6)
  )
  .apply(leadKeys) // Aplica el preset de lead.
  .mask("<x*4 ~*4>/2") // Toca durante la primera mitad de cada ciclo de 2 compases.
  .color('mediumseagreen');


// 4. BAJO (BASS)
// Sigue las notas raíz de la progresión armónica.
const bass = harmony.rootNotes()
  .struct("[x ~]!4 [x x ~ x]") // Patrón rítmico para el bajo.
  .apply(bassSynth)
  .color('goldenrod');


// --- MEZCLA FINAL ---
// Apila todas las partes y aplica transformaciones globales.
stack(
  drums,
  harmony,
  melody,
  bass
).slow(2) // Ralentiza todo el conjunto a la mitad para un tempo final de 62.5 BPM.
 .pianoroll({fold:1}) 
*/


/*
// -----------------------------------------------------------------
// SESSION 10 — POLYRHYTHM STUDY
// Explora superposiciones rítmicas: 7:8, 5:4 y 3:2 aplicadas a capas
// distintas (hi-hats, percusión, melodía y bajo). Reusa los presets
// `leadKeys` y `bassSynth` definidos en la sesión anterior.

setcpm(120/4);

// Presets locales para esta sesión (evita depender de otras sesiones)
const polyLeadKeys = p => p.s('sawtooth').cutoff(2500).gain(0.4)
  .attack(0.01).decay(0.15).sustain(0.2).release(0.25)
  .lpf(4000).lpr(0.2);

const polyBassSynth = p => p.s('sub').cutoff(600).gain(0.9)
  .attack(0.01).decay(0.2).sustain(0.1).release(0.2)
  .clip(0.9);

// Percusión polirrítmica: 7 golpes en el espacio de 8 (7:8) sobre hi-hats,
// y 5 golpes en el espacio de 4 (5:4) en una percusión secundaria.
const polyPerc = stack(
  s("bd*4").mask("x*4").gain(1),
  s("hh*7").slow(8/7).patt("1 0.6 0.8 0.6 0.9 0.7 0.5").gain(0.45),
  s("oh*5").slow(4/5).gain(0.6).delay(0.02).dfb(0.2)
).color('coral');

// Melodía con frase de 5 notas que corre a 5/4 (5 eventos en lugar de 4)
// creando un pulso que se desplaza respecto al compás base.
const polyMelody = n("<0 2 3 5 7>")
  .scale("a:minor")
  .slow(5/4) // 5:4 polyrhythm
  .layer(
    x => x.scaleTranspose(0).early(0),
    x => x.transpose(12).early(1/8).gain(0.6)
  )
  .apply(polyLeadKeys)
  .mask("<x ~ x ~ x>/2")
  .color('mediumseagreen');

// Bajo en relación 3:2 (más lento — tres golpes en el tiempo de dos ciclos base)
const polyBass = n("0 ~ 0 ~")
  .scale("a:minor")
  .slow(3/2) // 3:2 polyrhythm
  .apply(polyBassSynth)
  .gain(1.2)
  .color('goldenrod');

// Mezcla final para la sesión polirrítmica. Añadimos una pequeña reverb
// global y un paneo LFO para visualizar movimiento en el pianoroll.
stack(
  polyPerc,
  polyMelody,
  polyBass
)
  .apply(p => p.room(0.25)) // Aplica reverb a todos los elementos del stack
  .every(16, x => x.pan(sine.slow(4).range(0.1, 0.9)))
  ._pianoroll({fold:1, labels:1})
*/


/*
// -----------------------------------------------------------------
// SESSION 11 — RHYTHMIC EXPLORATION
// Foco exclusivo en percusión: síncopas, acentos dinámicos, fills.

setcpm(110/4);

// Capa base: bombo y caja sincopados
const kickSnare = stack(
  s("bd ~ [~ bd] ~").mask("x*2 [x ~]").gain(1.1),
  s("~ sd ~ sd").gain(0.95)
).color('coral');

// Texturas: hats con acentos, shaker y clap con eco
const hatsPerc = stack(
  s("hh*8").patt("1 0.7 0.9 0.6 1 0.8 0.9 0.7").gain(0.6),
  s("~*3 [~ shaker]").slow(2).gain(0.5),
  s("~ cp").every(4, rev).gain(0.8).delay(0.3).dfb(0.4).dt(1/6)
).color('skyblue');

// Efectos rítmicos: tom ocasional y stutter en la caja como fill
const fillsFx = stack(
  s("lt").mask("<~*7 x>/4").gain(0.7),
  // Fill de 1/16 en el último cuarto del ciclo sin usar stutter
  s("sd*4").fast(4).mask("<~*3 x>/4").gain(1)
).color('goldenrod');

// Mezcla final puramente rítmica
stack(
  kickSnare,
  hatsPerc,
  fillsFx
)
  ._pianoroll({fold:1, labels:1}) */

// -----------------------------------------------------------------
// SESSION 12 — SIMPLE BEAT
// Un patrón 4/4 básico de bombo, caja y hi-hat con acentos sutiles.
/*
setcpm(120/4);

const hats12 = n("0*8").s("hihat")
  .patt("0.9 0.7 0.8 0.7 0.9 0.7 0.8 0.7")
  .gain(0.35)
  .every(4, rev); // variación sutil cada 4 ciclos

const simpleBeat = stack(
  n("6 ~ 6 ~").s("kicks").gain(0.9).lpf(4500),          // kick (banco 'kicks')
  n("~ 0 ~ 0").s("clap").gain(1.0).clip(0.7).hpf(900),  // clap (banco 'clap')
  hats12                                                // hihat (banco 'hihat')
).gain(1.0).color('lightsteelblue');

simpleBeat._pianoroll({fill:1, strikeActive:1, labels:1})
*/


// -----------------------------------------------------------------
// SESSION 13 — DEEP HOUSE (simple, con bancos de samples como la sesión 8)
/*
setcpm(122/4);

// Hi-hat cerrado a corcheas con acentos sutiles
const dhHats = n("1*8").s("hihat")
  .patt("1 0.7 0.85 0.7 1 0.7 0.85 0.7")
  .gain(0.35);

// Hi-hat abierto en el off‑beat
const dhOpen = n("~ 5 ~ 5 ~ 5 ~ 5").s("hihat")
  .gain(0.45).lpf(9000).room(0.2);

// Bombo 4/4 y clap en 2 y 4
const session13 = stack(
  n("6*4").s("kicks").gain(0.95).lpf(5000),     // kick en cada negra
  n("~ 0 ~ 0").s("clap").clip(0.7).hpf(900).gain(1.0), // clap en 2 y 4
  dhHats,
  dhOpen
).gain(1.0).color('lightskyblue');

session13._pianoroll({fill:1, strikeActive:1, labels:1});
*/

/*************************************************************
 
 /*
// SESSION 14 — TRIO INVENTION (Andante)
// Tres voces en un estilo contrapuntístico, con un tempo más lento.

setcpm(23/4); // Tempo Andante

const baroqueOrgan = p => p.s('piano')
  .attack(0.01).decay(0.1).sustain(0.7).release(0.2)
  .lpf(2000).gain(0.6).room(0.1);

// Sujeto (melodía principal) en Do menor
const subject = n("0 2 3 5 4 3 2 1 0 -1 2 0")
  .scale("c4:minor")
  .fast(2)
  .apply(baroqueOrgan);

// Voz 1 (Soprano): Sujeto en la tónica, paneado a la derecha.
const voice1 = subject.pan(0.8);

// Voz 2 (Alto): Respuesta en la dominante, entra 1 ciclo después, paneado a la izquierda.
const voice2 = subject.scaleTranspose(2).late(1).pan(0.2);

// Voz 3 (Bajo): Línea de bajo melódica que entra 2 ciclos después, centrada.
const bassLine = n("0 -3 -4 -5 0 -3 -4 -5")
  .scale("c3:minor")
  .slow(0.5) // Se mueve a la mitad de la velocidad del sujeto
  .late(2)
  .apply(baroqueOrgan)
  .pan(0.5)
  .gain(0.8);

// Mezcla final de las tres voces
stack(voice1, voice2, bassLine)
  ._pianoroll({fold:1, labels:1})
*/

// -----------------------------------------------------------------
// SESSION 15
/*
setcpm(60/4); // 60 BPM, 4 pulsos por ciclo

// Preset coral
const choralePreset = p => p
  .s('sawtooth').cutoff(1800).lpr(0.1)
  .attack(0.1).release(0.6)
  .gain(0.8).room(0.25);

// Usa note() para alturas absolutas (g4, eb4, etc.)
const soprano = note("g4 g4 ab4 g4 f4 eb4 d4 c4").apply(choralePreset).pan(0.2);
const alto    = note("eb4 d4 c4 eb4 c4 c4 b3 c4").apply(choralePreset).pan(0.4);
const tenor   = note("c4 b3 f3 g3 ab3 g3 g3 g3").apply(choralePreset).pan(0.6);
const bass    = note("c3 g2 ab2 eb2 f2 c3 g2 c3").apply(choralePreset).pan(0.8);

stack(soprano, alto, tenor, bass)
  ._pianoroll({ minMidi:36, maxMidi:84, labels:1 })
*/

/*
const sopranoInst = p => p.s('sawtooth').cutoff(2400).lpr(0.15).attack(0.02).release(0.5).gain(0.85).room(0.2);
const altoInst    = p => p.s('triangle').cutoff(1800).attack(0.03).release(0.5).gain(0.75).room(0.2);
const tenorInst   = p => p.s('square').cutoff(1600).attack(0.02).release(0.5).gain(0.7).room(0.2);
const bassInst    = p => p.s('sub').cutoff(600).attack(0.01).release(0.5).gain(0.9).room(0.15);

// Voces (usar note() para alturas absolutas)
const soprano = note("g4 g4 ab4 g4 f4 eb4 d4 c4").apply(sopranoInst).pan(0.15);
const alto    = note("eb4 d4 c4 eb4 c4 c4 b3 c4").apply(altoInst).pan(0.35);
const tenor   = note("c4 b3 f3 g3 ab3 g3 g3 g3").apply(tenorInst).pan(0.65);
const bass    = note("c3 g2 ab2 eb2 f2 c3 g2 c3").apply(bassInst).pan(0.85);

// Mezcla
stack(soprano, alto, tenor, bass)
  ._pianoroll({ minMidi:36, maxMidi:84, labels:1 })
  */


/*
  // SESSION 16 — CHORDS STUDY (piano simple)
  setcpm(120/4);
  setDefaultVoicings('legacy');
  const stab16 = p => p
    .s('gm_piano').attack(0.01).release(0.25).lpf(2200).gain(0.8);

  const prog16 = "<Dm7 Bbmaj7 Gm7 A7>/2";

  const simplePiano16 = chord(prog16)
    .anchor('d4')          // centra las inversiones cerca de D4
    .dict('lefthand')      // voicings simples, cerrados
    .voicing()
    .apply(stab16)
    .gain(0.7);

const drums16 = stack(
  
  s("kicks:2*4").mask("x*3 [x ~ x ~]").gain(0.95),
  s("~ sd ~ sd").gain(0.85),
  s("hihat:2*8").patt("1 0.7 0.85 0.1 1 0.7 0.85 0.7").gain(0.45),
  // Hi‑hat abierto en el off‑beat, suave
  //s("~ oh ~ oh").lpf(9000).room(0.2).gain(0.4)
).color('lightsteelblue');

stack(
  simplePiano16,
  drums16
)._pianoroll({ fold:1, labels:1 })
*/


/*
setcpm(60/4); // Andante

// Presets por voz (sección de metales)
const brassSop  = p => p.s('gm_trumpet').attack(0.02).release(0.6).lpf(2800).gain(0.85).room(0.2);
const brassAlto = p => p.s('gm_french_horn').attack(0.03).release(0.6).lpf(2400).gain(0.8).room(0.2);
const brassTen  = p => p.s('gm_trombone').attack(0.03).release(0.6).lpf(2200).gain(0.75).room(0.2);
const brassBass = p => p.s('gm_tuba').attack(0.04).release(0.7).lpf(2000).gain(0.8).room(0.2);

// Progresión implícita: Dm7 – Bbmaj7 – Gm7 – A7 (ii–VI–i–V) y repite
// Líneas SATB (homofónicas), 8 pasos por ciclo
const soprano17 = note("a4 bb4 g4 e4  a4 bb4 g4 e4").apply(brassSop).pan(0.15);
const alto17    = note("f4 d4 bb3 c#4  f4 d4 bb3 c#4").apply(brassAlto).pan(0.35);
const tenor17   = note("a3 f3 d3 c#3  a3 f3 d3 c#3").apply(brassTen).pan(0.65);
const bass17    = note("d3 bb2 g2 a2  d3 bb2 g2 a2").apply(brassBass).pan(0.85);

// Mezcla
stack(soprano17, alto17, tenor17, bass17)
  ._pianoroll({ minMidi:36, maxMidi:84, labels:1 })

  
*/



/*
// SESSION 18 — CHORDS & CHORALE
// Combina un pad de acordes con un coral de metales a cuatro voces.
setcpm(70/4); // Tempo lento
setDefaultVoicings('legacy');

// --- PRESETS ---
// Pad suave para la base armónica
const pad18 = p => p.s('triangle').cutoff(1600).attack(1.5).release(2.5).gain(0.5).room(0.4);

// Presets para el coral de metales
const brassSop18  = p => p.s('gm_trumpet').attack(0.1).release(1.2).lpf(2800).gain(0.8).room(0.3);
const brassAlto18 = p => p.s('gm_french_horn').attack(0.15).release(1.2).lpf(2400).gain(0.7).room(0.3);
const brassTen18  = p => p.s('gm_trombone').attack(0.15).release(1.2).lpf(2200).gain(0.6).room(0.3);
const brassBass18 = p => p.s('gm_tuba').attack(0.2).release(1.5).lpf(2000).gain(0.7).room(0.3);

// --- PARTES MUSICALES ---
// 1. Acordes (Pads)
const prog18 = "<Dm7 Bbmaj7 Gm7 Am7>/2";
const harmonyPads = chord(prog18)
  .voicing()
  .apply(pad18)
  .color('cyan');

// 2. Coral (Metales)
// Las líneas melódicas siguen la armonía de los pads.
const soprano18 = note("a4 a4 g4 g4 | f4 e4 e4 e4").apply(brassSop18).pan(0.2);
const alto18    = note("f4 f4 d4 d4 | d4 c#4 c#4 c#4").apply(brassAlto18).pan(0.4);
const tenor18   = note("c4 d4 bb3 bb3 | g3 g3 a3 a3").apply(brassTen18).pan(0.6);
const bass18    = note("d3 bb2 g2 a2 | d3 bb2 g2 a2").apply(brassBass18).pan(0.8);

const chorale18 = stack(soprano18, alto18, tenor18, bass18);

// --- MEZCLA FINAL ---
stack(
  harmonyPads,
  chorale18.mask("<~ x ~ x>") // El coral entra en los tiempos 2 y 4 para dar espacio
)._pianoroll({ minMidi:36, maxMidi:84, labels:1 })

*/


// SESSION 19 
setCps(113/60/4)

await samples({'gtr': 'gtr/0001_cleanC.wav'}, 'github:tidalcycles/Dirt-Samples/master/');

const guitar    = x => x.note().s("gtr").room(.7).gain(0.5).clip(1).release(0.5).delay(0.55)
const accordi   = x => x.note().s("gm_tremolo_strings:3").gain(0.2).clip(1).release(0.5)
const basso     = x => x.note().s("subs").gain(1.2).clip(1).sustain(0.95).delay(0.25)
const ritmo     = x => x.bank("AlesisHR16").clip(1).gain(0.75)

const scala = cat('c dorian')  // IV VI I III
stack(
"<[5,13,7] [5,9,11] [0,9,13] [6,13,14]>".scale(scala).apply(accordi).delay(2),
//"~@2 2 <[7,5,3 9 6 6][7 5 3 6,4 <[2,6,4 0]>]>@2 2 <8,11 6,13 4,9 14>@2".scale(scala).transpose(-5).apply(guitar),
//"<-5 -2 0 -1>".struct("[[x ~]!2 x x@0.5 [x ~]!2 x@0.5 [x ~]!2]").scale(scala).apply(basso),
s("bd!4,[~ sd]!2,[~ hh!2 hh*2]!2").apply(ritmo).room(0.1).delay(.25),
//s("hh!7 <~@3 hh*5 ~@3 hh*3  hh!2>").patt("0.1 0.5 1.5 1 1 0.6 0.9 1").apply(ritmo).gain(3.5)  
)._pianoroll({minMidi:10, labels:1, strikeActive:1})



/*
// "She don't use jelly" (work in progress)
// composed @by The Flaming Lips
// script @by eefano
const gString = register('gString', (n,tuning, pat) => 
  (pat.fmap((v) => { if(v[n]=='x') return note(0).velocity(0);
      return note(v[n]+tuning[n]); } 
  ).innerJoin()));
const guitar = (strums,fingers,tuning=[40,45,50,55,59,64]) => (strums.pickOut(
    [fingers.pickOut(fingering).gString(0,tuning),fingers.pickOut(fingering).gString(1,tuning),fingers.pickOut(fingering).gString(2,tuning)
    ,fingers.pickOut(fingering).gString(3,tuning),fingers.pickOut(fingering).gString(4,tuning),fingers.pickOut(fingering).gString(5,tuning)]));
const split = register('split', (deflt, callback, pat) => callback(deflt.map((d,i)=> pat.withValue((v)=>{
  const isobj = v.value !== undefined; const value = isobj ? v.value : v;
  const result = Array.isArray(value)?(i<value.length?value[i]:d):(i==0?value:d);
  return (i==0 && isobj) ? {...v,value:result} : result; }))));

setCps(86 / 60 )
const fingering = 
{D5:"x:5:7:7:x:x",G5:"3:5:5:x:x:x",A5:"5:7:7:x:x:x",
 D:"10:12:12:11:10:10",C:"8:10:10:9:8:8",G:"3:5:5:4:3:3",A:"5:7:7:6:5:5"
};
const sk = 300, sh = silence, strumming = 
{d: stack(0,timeCat([1,sh],[sk,1]),timeCat([2,sh],[sk,2]),timeCat([3,sh],[sk,3]),timeCat([4,sh],[sk,4]),timeCat([5,sh],[sk,5]))
,u: stack(5,timeCat([1,sh],[sk,4]),timeCat([2,sh],[sk,3]),timeCat([3,sh],[sk,2]),timeCat([4,sh],[sk,1]),timeCat([5,sh],[sk,0]))
};
const song = "<0 1@8 2>/4"

lead: song.pickRestart(
  ["<~ ~ ~ [~ c4:7:.5]>"
  ,"<f#4 f#4*2 [a4:3:.1 f#4:-2:.1] [e4 f#4@2:3:.1 f#4]@2 f#4*2 [g4 f#4] [c#5:-2:.1 e4:2:1] >"
  ,"<f#4 ~@3>"
  ]).as("note:penv:patt").release(song.pickRestart([0,0,2]))
  .s("gm_overdriven_guitar:11").color('magenta').gain(.55).hpf(400).lpf(5000).pan(.5)

rthm: song.pickRestart(
  ["~"
  ,"<D5:d [D5:d D5:u] G5:d [G5:d A5:u@2 A5:d]@2 [G5:d G5:u] [A5:d A5:u] [G5:d ~]>"
  ,"<D5:d ~@3>"
  ]).split([0,0],s=>guitar(s[1].pickRestart(strumming),s[0]).transpose(-12)
  .release(song.pickRestart([.1,.1,2]))
  .s("gm_overdriven_guitar:6").color('cyan').hpf(700).lpf(6000)).gain(1.5).pan(.4)

bass: song.pickRestart(
  ["~"
  ,note("<d2 d2*2 g1*2 [g1 a1@2 a1]@2 g1*2 a1*2 [g1 ~]>")
  ,"~"
  ]).s("gm_electric_bass_finger").color('green').lpf(500).dist("4:.25")
 
drum: song.pickRestart(
  ["~"
  ,"<cr,[hh!15 oh],[bd sd bd*2 [sd bd] [~ sd] [bd ~] [sd bd] [bd sd]]>/8"
  ,"<cr,bd>/4"
]).pickOut({
  bd:s('linndrum_bd').hpf(50).lpf(2000).velocity(.8),
  sd:s('linndrum_sd').hpf(200).velocity(.7),
  hh:s('linndrum_hh').hpf(7000).speed(1.5).velocity(.3),
  oh:s('linndrum_oh').hpf(7000).speed(1.1).velocity(.3),
  cr:s('linndrum_cr').hpf(7000).speed(1.2).velocity(.3),
}).color('yellow').gain(1.2)

all(x=>x.rsize(.8).room(1.3)
  //  .ribbon(1*4,2*4)
  )


  */