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
  chord("<Cm7 Bb7b9 Fm7 [G7#9 G7b9 G7b13]>/2")
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
  ._pianoroll({minMidi:10})
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

await samples({
    'kick': 'deep-808.mp3'
  }, 'http://172.18.224.1:5432/')

setcps(130/60/4)
kick: n("<0 1 2>").s("kicks").gain(0.9)