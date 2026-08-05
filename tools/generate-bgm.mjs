import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";

const rate = 22050;
const duration = 16;
const outDir = path.resolve("assets/audio");
fs.mkdirSync(outDir, { recursive: true });

const notes = { C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,G5:783.99 };
const tracks = [
  { file:"bgm-area.wav", bpm:92, lead:["C4","E4","G4","E4","D4","F4","A4","G4"], bass:["C3","C3","F3","G3"], wave:"triangle" },
  { file:"bgm-fishing.wav", bpm:72, lead:["G4","E4","D4","E4","C4","D4","E4","G4"], bass:["C3","A3","F3","G3"], wave:"sine" },
  { file:"bgm-battle.wav", bpm:132, lead:["E4","G4","A4","G4","E4","D4","E4","B4"], bass:["E3","E3","D3","B3"], wave:"square" },
  { file:"bgm-result.wav", bpm:110, lead:["C4","E4","G4","C5","G4","A4","G4","E4"], bass:["C3","F3","G3","C3"], wave:"triangle" },
  { file:"bgm-menu.wav", bpm:82, lead:["E4","G4","B4","G4","D4","F4","A4","F4"], bass:["C3","G3","A3","F3"], wave:"sine" },
  { file:"bgm-shop.wav", bpm:104, lead:["C5","G4","E4","G4","D5","B4","G4","B4"], bass:["C3","E3","F3","G3"], wave:"triangle" },
];

function osc(kind, phase) {
  if (kind === "square") return Math.sin(phase) >= 0 ? 1 : -1;
  if (kind === "triangle") return 2 / Math.PI * Math.asin(Math.sin(phase));
  return Math.sin(phase);
}

function writeWav(file, samples) {
  const dataBytes = samples.length * 2;
  const b = Buffer.alloc(44 + dataBytes);
  b.write("RIFF",0); b.writeUInt32LE(36+dataBytes,4); b.write("WAVEfmt ",8); b.writeUInt32LE(16,16);
  b.writeUInt16LE(1,20); b.writeUInt16LE(1,22); b.writeUInt32LE(rate,24); b.writeUInt32LE(rate*2,28);
  b.writeUInt16LE(2,32); b.writeUInt16LE(16,34); b.write("data",36); b.writeUInt32LE(dataBytes,40);
  samples.forEach((v,i) => b.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(v*32767))),44+i*2));
  fs.writeFileSync(path.join(outDir,file),b);
}

for (const track of tracks) {
  const count = rate * duration;
  const samples = new Float32Array(count);
  const beat = 60 / track.bpm;
  for (let i=0;i<count;i++) {
    const t=i/rate;
    const step=Math.floor(t/(beat/2))%track.lead.length;
    const local=(t%(beat/2))/(beat/2);
    const lead=notes[track.lead[step]];
    const bass=notes[track.bass[Math.floor(t/(beat*2))%track.bass.length]];
    const envelope=Math.min(1,local*10)*Math.pow(1-local,.7);
    const pad=Math.sin(2*Math.PI*(bass*2)*t)*.07;
    const melody=osc(track.wave,2*Math.PI*lead*t)*envelope*.18;
    const low=Math.sin(2*Math.PI*bass*t)*.12;
    const sparkle=step%2===0?Math.sin(2*Math.PI*lead*2*t)*envelope*.035:0;
    samples[i]=(melody+low+pad+sparkle)*.72;
  }
  const fade=Math.floor(rate*.08);
  for(let i=0;i<fade;i++){ const k=i/fade; samples[i]*=k; samples[count-1-i]*=k; }
  writeWav(track.file,samples);
}

console.log(`Generated ${tracks.length} BGM loops in ${outDir}`);
